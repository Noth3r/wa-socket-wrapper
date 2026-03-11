import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type AuthenticationState,
  type ConnectionState,
  type WAMessage,
  type WASocket,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { createSessionId, type SessionConfig, type SessionId, type SessionInfo, type SessionStatus } from '../types/session.js';
import type { WebhookEvent } from '../types/webhook.js';
import { SessionNotConnectedError, SessionNotFoundError, ValidationError } from '../utils/errors.js';
import { webhookDispatcher } from './webhook.js';
import { normalizeMessagesUpsert } from './message-normalizer.js';

type Store = {
  clear?: () => void;
};

export type BaileysSession = {
  socket: WASocket;
  state: AuthenticationState;
  status: SessionStatus;
  qr?: string;
  config: SessionConfig;
  store: Store;
};

const sessionLogger = logger.child({ module: 'SessionManager' });
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 16000] as const;
const MAX_RECONNECT_RETRIES = 5;
const WA_OPERATION_DELAY_MS = 500;

export class SessionManager {
  private readonly sessions = new Map<string, BaileysSession>();
  private readonly operationQueue = new Map<string, Promise<unknown>>();
  private readonly reconnectAttempts = new Map<string, number>();
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly stoppingSessions = new Set<string>();

  constructor(
    private readonly eventCallback?: (sessionId: string, event: WebhookEvent | string, data: unknown) => void,
  ) {}

  async startSession(sessionId: string, sessionConfig: SessionConfig = {}): Promise<SessionInfo> {
    return this.queueOperation(sessionId, async () => {
      if (this.sessions.has(sessionId)) {
        throw new ValidationError(`Session '${sessionId}' already exists`);
      }

      const session = await this.createSocketSession(sessionId, sessionConfig);
      this.sessions.set(sessionId, session);
      this.reconnectAttempts.set(sessionId, 0);

      sessionLogger.info({ sessionId }, 'Session started');
      return this.toSessionInfo(sessionId, session);
    });
  }

  async start(sessionId: string, sessionConfig: SessionConfig = {}): Promise<SessionInfo> {
    return this.startSession(sessionId, sessionConfig);
  }

  async stopSession(sessionId: string): Promise<void> {
    return this.queueOperation(sessionId, async () => {
      const session = this.getSession(sessionId);
      this.stoppingSessions.add(sessionId);
      this.clearReconnectTimer(sessionId);

      try {
        this.cleanupSocket(session);
        this.sessions.delete(sessionId);
      } finally {
        this.stoppingSessions.delete(sessionId);
      }

      sessionLogger.info({ sessionId }, 'Session stopped');
    });
  }

  async stop(sessionId: string): Promise<void> {
    return this.stopSession(sessionId);
  }

  async restartSession(sessionId: string): Promise<SessionInfo> {
    return this.queueOperation(sessionId, async () => {
      const current = this.getSession(sessionId);
      const previousConfig = current.config;
      this.stoppingSessions.add(sessionId);
      this.clearReconnectTimer(sessionId);
      this.cleanupSocket(current);
      this.sessions.delete(sessionId);
      this.stoppingSessions.delete(sessionId);

      const replacement = await this.createSocketSession(sessionId, previousConfig);
      this.sessions.set(sessionId, replacement);
      this.reconnectAttempts.set(sessionId, 0);
      return this.toSessionInfo(sessionId, replacement);
    });
  }

  async restart(sessionId: string): Promise<SessionInfo> {
    return this.restartSession(sessionId);
  }

  async terminateSession(sessionId: string): Promise<void> {
    return this.queueOperation(sessionId, async () => {
      const session = this.getSession(sessionId);
      this.stoppingSessions.add(sessionId);
      this.clearReconnectTimer(sessionId);

      try {
        await session.socket.logout();
      } catch (error) {
        sessionLogger.warn({ sessionId, error }, 'Session logout failed during terminate');
      }

      try {
        this.cleanupSocket(session);
        this.sessions.delete(sessionId);
        this.reconnectAttempts.delete(sessionId);

        const authPath = this.getSessionAuthPath(sessionId);
        await fs.rm(authPath, { recursive: true, force: true });
      } finally {
        this.stoppingSessions.delete(sessionId);
      }

      sessionLogger.info({ sessionId }, 'Session terminated');
    });
  }

  async terminate(sessionId: string): Promise<void> {
    return this.terminateSession(sessionId);
  }

  getSession(sessionId: string): BaileysSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  getSessionStatus(sessionId: string): SessionStatus {
    return this.getSession(sessionId).status;
  }

  getAllSessions(): SessionInfo[] {
    return [...this.sessions.entries()].map(([sessionId, session]) => this.toSessionInfo(sessionId, session));
  }

  getSessionSocket(sessionId: string): WASocket {
    const session = this.getSession(sessionId);
    if (session.status !== 'connected') {
      throw new SessionNotConnectedError(sessionId);
    }
    return session.socket;
  }

  getSessionInfo(sessionId: string): SessionInfo | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }
    return this.toSessionInfo(sessionId, session);
  }

  isConnected(sessionId: string): boolean {
    try {
      const session = this.getSession(sessionId);
      return session.status === 'connected';
    } catch {
      return false;
    }
  }

  async requestPairingCode(sessionId: string, phoneNumber: string): Promise<string> {
    const session = this.getSession(sessionId);
    // Baileys socket has requestPairingCode method
    const pairingCode = await (session.socket as any).requestPairingCode(phoneNumber);
    return pairingCode;
  }

  async restoreSessions(): Promise<void> {
    await fs.mkdir(config.SESSIONS_PATH, { recursive: true });
    const entries = await fs.readdir(config.SESSIONS_PATH, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith('session-')) {
        continue;
      }

      const sessionId = entry.name.slice('session-'.length);
      if (!sessionId || this.sessions.has(sessionId)) {
        continue;
      }

      try {
        await this.startSession(sessionId);
      } catch (error) {
        sessionLogger.error({ sessionId, error }, 'Failed restoring session');
      }
    }
  }

  private async createSocketSession(sessionId: string, sessionConfig: SessionConfig): Promise<BaileysSession> {
    const authPath = this.getSessionAuthPath(sessionId);
    await fs.mkdir(authPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, sessionLogger),
      },
      logger: sessionLogger,
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      browser: ['WA-Socket', 'Chrome', '120.0.0'],
    });

    const session: BaileysSession = {
      socket,
      state,
      status: 'starting',
      config: sessionConfig,
      store: {},
    };

    this.registerSocketEvents(sessionId, session, saveCreds);
    return session;
  }

  private registerSocketEvents(sessionId: string, session: BaileysSession, saveCreds: () => Promise<void>): void {
    const socket = session.socket;

    const forwardEvents: WebhookEvent[] = [
      'messages.upsert',
      'messages.update',
      'messages.delete',
      'messages.reaction',
      'chats.upsert',
      'chats.update',
      'chats.delete',
      'chats.set',
      'contacts.upsert',
      'contacts.update',
      'contacts.set',
      'groups.update',
      'group-participants.update',
      'presence.update',
      'status.set',
      'blocklist.update',
      'call',
      'labels.association',
      'labels.edit',
      'auth.update',
    ];

    for (const event of forwardEvents) {
      socket.ev.on(event as never, (payload: unknown) => {
        this.forwardEvent(sessionId, event, payload);
      });
    }

    socket.ev.on('connection.update', (update) => {
      this.handleConnectionUpdate(sessionId, update);
      this.forwardEvent(sessionId, 'connection.update', update);
      if (update.qr) {
        this.forwardEvent(sessionId, 'qr', { qr: update.qr });
      }
    });

    socket.ev.on('creds.update', (data) => {
      void saveCreds();
      this.forwardEvent(sessionId, 'creds.update', data);
    });
  }

  private handleConnectionUpdate(sessionId: string, update: Partial<ConnectionState>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    if (update.qr) {
      session.qr = update.qr;
      session.status = 'qr_ready';
    }

    if (update.connection === 'open') {
      session.status = 'connected';
      session.qr = undefined;
      this.reconnectAttempts.set(sessionId, 0);
      this.clearReconnectTimer(sessionId);
      return;
    }

    if (update.connection === 'close') {
      const statusCode = (update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output
        ?.statusCode;

      session.status = statusCode === DisconnectReason.loggedOut ? 'terminated' : 'disconnected';

      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut && !this.stoppingSessions.has(sessionId) && session.config.autoRestart !== false;

      if (shouldReconnect) {
        this.scheduleReconnect(sessionId);
      }
    }
  }

  private scheduleReconnect(sessionId: string): void {
    const attempts = this.reconnectAttempts.get(sessionId) ?? 0;
    if (attempts >= MAX_RECONNECT_RETRIES) {
      sessionLogger.error({ sessionId, attempts }, 'Max reconnect attempts reached');
      return;
    }

    this.clearReconnectTimer(sessionId);
    const delay = RECONNECT_DELAYS_MS[Math.min(attempts, RECONNECT_DELAYS_MS.length - 1)];
    this.reconnectAttempts.set(sessionId, attempts + 1);

    const timer = setTimeout(async () => {
      const activeSession = this.sessions.get(sessionId);
      if (!activeSession || this.stoppingSessions.has(sessionId)) {
        return;
      }

      try {
        this.cleanupSocket(activeSession);
        const replacement = await this.createSocketSession(sessionId, activeSession.config);
        replacement.status = 'starting';
        this.sessions.set(sessionId, replacement);
        sessionLogger.info({ sessionId, attempt: attempts + 1 }, 'Session reconnect attempt started');
      } catch (error) {
        sessionLogger.error({ sessionId, error }, 'Reconnect attempt failed');
        this.scheduleReconnect(sessionId);
      }
    }, delay);

    this.reconnectTimers.set(sessionId, timer);
  }

  private clearReconnectTimer(sessionId: string): void {
    const timer = this.reconnectTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(sessionId);
    }
  }

  private cleanupSocket(session: BaileysSession): void {
    session.socket.ev.removeAllListeners('connection.update');
    (session.socket as unknown as { ws?: { close?: () => void } }).ws?.close?.();

    session.socket = null as unknown as WASocket;
    session.store?.clear?.();
    session.store = null as unknown as Store;
    session.state = null as unknown as AuthenticationState;
  }

  private forwardEvent(sessionId: string, event: WebhookEvent | string, data: unknown): void {
    this.eventCallback?.(sessionId, event, data);
  }

  private getSessionAuthPath(sessionId: string): string {
    return join(config.SESSIONS_PATH, `session-${sessionId}`);
  }

  private toSessionInfo(sessionId: string, session: BaileysSession): SessionInfo {
    const user = session.socket?.user;
    return {
      id: createSessionId(sessionId) as SessionId,
      status: session.status,
      qr: session.qr,
      me: user ? {
        id: user.id,
        name: user.name,
        number: user.id.split('@')[0],
      } : undefined,
    };
  }

  private async queueOperation<T>(sessionId: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.operationQueue.get(sessionId) ?? Promise.resolve();

    const current = previous
      .catch(() => undefined)
      .then(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(resolve, WA_OPERATION_DELAY_MS);
          }),
      )
      .then(operation);

    this.operationQueue.set(sessionId, current);

    try {
      return await current;
    } finally {
      if (this.operationQueue.get(sessionId) === current) {
        this.operationQueue.delete(sessionId);
      }
    }
  }
}

export const sessionManager = new SessionManager((sessionId, event, data) => {
  const session = sessionManager['sessions'].get(sessionId);
  if (session) {
    let dispatchData = data;
    if (event === 'messages.upsert') {
      dispatchData = normalizeMessagesUpsert(data as { messages: WAMessage[], type: string });
    }
    void webhookDispatcher.dispatch(sessionId, event as WebhookEvent, dispatchData, session.config);
  }
});
export default sessionManager;
