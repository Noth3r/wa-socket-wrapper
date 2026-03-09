import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  const useMultiFileAuthState = vi.fn();
  const fetchLatestBaileysVersion = vi.fn();
  const makeWASocket = vi.fn();

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
    },
  };
});

import { promises as fs } from 'node:fs';
import * as baileysModule from '@whiskeysockets/baileys';
import { SessionManager } from '../../src/services/session-manager.js';

type EventHandler = (payload: unknown) => void;

const mockedFs = fs as unknown as {
  mkdir: ReturnType<typeof vi.fn>;
  rm: ReturnType<typeof vi.fn>;
  readdir: ReturnType<typeof vi.fn>;
};

const mockedBaileys = baileysModule as unknown as {
  DisconnectReason: { loggedOut: number };
  __mockBaileys: {
    useMultiFileAuthState: ReturnType<typeof vi.fn>;
    fetchLatestBaileysVersion: ReturnType<typeof vi.fn>;
    makeWASocket: ReturnType<typeof vi.fn>;
  };
};

function createMockSocket() {
  const handlers = new Map<string, EventHandler[]>();

  const socket: any = {
    ev: {
      on: vi.fn((event: string, handler: EventHandler) => {
        const existing = handlers.get(event) ?? [];
        existing.push(handler);
        handlers.set(event, existing);
      }),
      removeAllListeners: vi.fn(() => handlers.clear()),
      emit(event: string, payload: unknown) {
        for (const handler of handlers.get(event) ?? []) {
          handler(payload);
        }
      },
    },
    logout: vi.fn().mockResolvedValue(undefined),
    ws: {
      close: vi.fn(),
    },
  };

  return socket;
}

describe('SessionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.rm.mockResolvedValue(undefined);
    mockedFs.readdir.mockResolvedValue([]);

    mockedBaileys.__mockBaileys.useMultiFileAuthState.mockResolvedValue({
      state: { creds: {}, keys: {} },
      saveCreds: vi.fn().mockResolvedValue(undefined),
    });

    mockedBaileys.__mockBaileys.fetchLatestBaileysVersion.mockResolvedValue({
      version: [2, 3000, 1],
      isLatest: true,
    });

    mockedBaileys.__mockBaileys.makeWASocket.mockImplementation(() => createMockSocket());
  });

  it('creates session and adds it to registry', async () => {
    const manager = new SessionManager();

    const start = manager.startSession('alpha');
    await vi.advanceTimersByTimeAsync(500);
    const info = await start;

    expect(info.status).toBe('starting');
    expect(manager.getAllSessions()).toHaveLength(1);
  });

  it('rejects duplicate session IDs', async () => {
    const manager = new SessionManager();

    const first = manager.startSession('dup');
    await vi.advanceTimersByTimeAsync(500);
    await first;

    const duplicate = manager.startSession('dup');
    const duplicateAssertion = expect(duplicate).rejects.toThrow("Session 'dup' already exists");
    await vi.advanceTimersByTimeAsync(500);
    await duplicateAssertion;
  });

  it('captures QR code from connection.update', async () => {
    const manager = new SessionManager();

    const start = manager.startSession('qr-session');
    await vi.advanceTimersByTimeAsync(500);
    await start;

    const session = manager.getSession('qr-session');
    session.socket.ev.emit('connection.update', { qr: 'qr-code' });

    expect(manager.getSessionStatus('qr-session')).toBe('qr_ready');
    expect(manager.getSession('qr-session').qr).toBe('qr-code');
  });

  it('forwards Baileys events through callback', async () => {
    const callback = vi.fn();
    const manager = new SessionManager(callback);

    const start = manager.startSession('events');
    await vi.advanceTimersByTimeAsync(500);
    await start;

    const session = manager.getSession('events');
    session.socket.ev.emit('messages.upsert', { messages: [] });

    expect(callback).toHaveBeenCalledWith('events', 'messages.upsert', { messages: [] });
  });

  it('stops session, clears listeners, and removes it from registry', async () => {
    const manager = new SessionManager();

    const start = manager.startSession('stop');
    await vi.advanceTimersByTimeAsync(500);
    await start;

    const socket = manager.getSession('stop').socket;

    const stop = manager.stopSession('stop');
    await vi.advanceTimersByTimeAsync(500);
    await stop;

    expect(socket.ev.removeAllListeners).toHaveBeenCalledOnce();
    expect(manager.getAllSessions()).toHaveLength(0);
    expect(() => manager.getSession('stop')).toThrow();
  });

  it('restarts an existing session', async () => {
    const manager = new SessionManager();

    const start = manager.startSession('restart');
    await vi.advanceTimersByTimeAsync(500);
    await start;

    const restart = manager.restartSession('restart');
    await vi.advanceTimersByTimeAsync(500);
    const info = await restart;

    expect(info.status).toBe('starting');
    expect(manager.getAllSessions()).toHaveLength(1);
    expect(mockedBaileys.__mockBaileys.makeWASocket).toHaveBeenCalledTimes(2);
  });

  it('terminates session and deletes auth path', async () => {
    const manager = new SessionManager();

    const start = manager.startSession('term');
    await vi.advanceTimersByTimeAsync(500);
    await start;

    const socket = manager.getSession('term').socket;

    const terminate = manager.terminateSession('term');
    await vi.advanceTimersByTimeAsync(500);
    await terminate;

    expect(socket.logout).toHaveBeenCalledOnce();
    expect(mockedFs.rm).toHaveBeenCalledOnce();
    expect(manager.getAllSessions()).toHaveLength(0);
  });

  it('reconnects on close with exponential backoff when not logged out', async () => {
    const manager = new SessionManager();

    const start = manager.startSession('reconnect');
    await vi.advanceTimersByTimeAsync(500);
    await start;

    const session = manager.getSession('reconnect');
    session.socket.ev.emit('connection.update', {
      connection: 'close',
      lastDisconnect: { error: { output: { statusCode: 500 } } },
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(mockedBaileys.__mockBaileys.makeWASocket).toHaveBeenCalledTimes(2);
  });

  it('does not reconnect when disconnect reason is loggedOut', async () => {
    const manager = new SessionManager();

    const start = manager.startSession('logged-out');
    await vi.advanceTimersByTimeAsync(500);
    await start;

    const session = manager.getSession('logged-out');
    session.socket.ev.emit('connection.update', {
      connection: 'close',
      lastDisconnect: {
        error: { output: { statusCode: mockedBaileys.DisconnectReason.loggedOut } },
      },
    });

    await vi.advanceTimersByTimeAsync(20000);

    expect(manager.getSessionStatus('logged-out')).toBe('terminated');
    expect(mockedBaileys.__mockBaileys.makeWASocket).toHaveBeenCalledTimes(1);
  });

  it('enforces 500ms operation queue delay between operations', async () => {
    const manager = new SessionManager();

    const start = manager.startSession('queue');
    await vi.advanceTimersByTimeAsync(500);
    await start;

    const stopPromise = manager.stopSession('queue');
    let done = false;
    stopPromise.then(() => {
      done = true;
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await stopPromise;
    expect(done).toBe(true);
  });

  it('restores persisted sessions from directory', async () => {
    mockedFs.readdir.mockResolvedValue([
      { isDirectory: () => true, name: 'session-r1' },
      { isDirectory: () => true, name: 'session-r2' },
      { isDirectory: () => false, name: 'tmp.txt' },
    ]);

    const manager = new SessionManager();

    const restore = manager.restoreSessions();
    await vi.advanceTimersByTimeAsync(1500);
    await restore;

    expect(manager.getAllSessions()).toHaveLength(2);
  });
});
