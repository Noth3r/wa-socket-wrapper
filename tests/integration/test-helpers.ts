import { EventEmitter } from 'node:events';
import { vi } from 'vitest';

type EventHandler = (payload: unknown) => void;

export type MockSocket = {
  ev: EventEmitter & {
    on: (event: string, handler: EventHandler) => EventEmitter;
    removeAllListeners: (event: string) => EventEmitter;
    emit: (event: string, payload: unknown) => boolean;
  };
  logout: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  ws: {
    close: ReturnType<typeof vi.fn>;
  };
};

const socketRegistry = new Map<string, MockSocket>();
let pendingSessionId = 'unknown';

function extractSessionIdFromAuthPath(authPath: string): string {
  const normalized = authPath.replace(/\\/g, '/');
  const match = normalized.match(/session-([^/]+)$/);
  return match?.[1] ?? 'unknown';
}

export function mockBaileysSocket(): MockSocket {
  const ev = new EventEmitter() as MockSocket['ev'];

  const socket: MockSocket = {
    ev,
    logout: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue({ key: { id: 'mock-message-id' } }),
    ws: {
      close: vi.fn(),
    },
  };

  return socket;
}

vi.mock('node:fs', () => {
  const promises = {
    mkdir: vi.fn().mockResolvedValue(undefined),
    rm: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
  };

  return {
    promises,
    __mockFs: promises,
  };
});

vi.mock('@whiskeysockets/baileys', () => {
  const useMultiFileAuthState = vi.fn(async (authPath: string) => {
    pendingSessionId = extractSessionIdFromAuthPath(authPath);
    return {
      state: { creds: {}, keys: {} },
      saveCreds: vi.fn().mockResolvedValue(undefined),
    };
  });

  const fetchLatestBaileysVersion = vi.fn(async () => ({
    version: [2, 3000, 1],
    isLatest: true,
  }));

  const makeWASocket = vi.fn(() => {
    const socket = mockBaileysSocket();
    socketRegistry.set(pendingSessionId, socket);
    return socket;
  });

  return {
    default: makeWASocket,
    DisconnectReason: {
      loggedOut: 401,
    },
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore: vi.fn((keys: unknown) => keys),
    useMultiFileAuthState,
    __mockBaileys: {
      useMultiFileAuthState,
      fetchLatestBaileysVersion,
      makeWASocket,
      socketRegistry,
    },
  };
});

export async function createTestApp() {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.API_KEY = 'test-api-key';
  process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ?? '3';
  process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ?? '1000';
  process.env.ENABLE_WEBSOCKET = 'true';
  process.env.ENABLE_SWAGGER = 'false';

  const { createApp } = await import('../../src/app.js');
  return {
    app: createApp(),
    apiKey: 'test-api-key',
  };
}

export function getSocketBySessionId(sessionId: string): MockSocket | undefined {
  return socketRegistry.get(sessionId);
}

export async function getMockedBaileys() {
  const module = (await import('@whiskeysockets/baileys')) as unknown as {
    __mockBaileys: {
      makeWASocket: ReturnType<typeof vi.fn>;
      useMultiFileAuthState: ReturnType<typeof vi.fn>;
      fetchLatestBaileysVersion: ReturnType<typeof vi.fn>;
    };
  };

  return module.__mockBaileys;
}

export async function getMockedFs() {
  const module = (await import('node:fs')) as unknown as {
    __mockFs: {
      mkdir: ReturnType<typeof vi.fn>;
      rm: ReturnType<typeof vi.fn>;
      readdir: ReturnType<typeof vi.fn>;
    };
  };

  return module.__mockFs;
}

export async function resetIntegrationState(): Promise<void> {
  const { sessionManager } = await import('../../src/services/session-manager.js');
  const { sseManager } = await import('../../src/services/sse.js');
  const { webSocketManager } = await import('../../src/services/websocket.js');
  const { createSessionId } = await import('../../src/types/index.js');

  const existing = sessionManager.getAllSessions();
  for (const session of existing) {
    try {
      await sessionManager.terminateSession(session.id as unknown as string);
    } catch {
      // best-effort cleanup for test isolation
    }

    const sid = createSessionId(session.id as unknown as string);
    sseManager.closeSession(sid);
    webSocketManager.closeSession(sid);
  }

  sseManager.closeAll();
  socketRegistry.clear();
  vi.clearAllMocks();
}
