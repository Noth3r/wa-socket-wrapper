import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

const terminateSessionMock = vi.fn();
const getAllSessionsMock = vi.fn();
const closeAllSseMock = vi.fn();
const closeWsMock = vi.fn(async () => undefined);

vi.mock('../src/services/session-manager.js', () => ({
  sessionManager: {
    getAllSessions: getAllSessionsMock,
    terminateSession: terminateSessionMock,
  },
}));

vi.mock('../src/services/sse.js', () => ({
  sseManager: {
    closeAll: closeAllSseMock,
  },
}));

vi.mock('../src/services/websocket.js', () => ({
  webSocketManager: {
    close: closeWsMock,
  },
}));

describe('Express app assembly', () => {
  const originalApiKey = process.env.API_KEY;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.API_KEY = 'test-api-key';
    terminateSessionMock.mockReset();
    getAllSessionsMock.mockReset();
    closeAllSseMock.mockReset();
    closeWsMock.mockClear();
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = originalApiKey;
    }
  });

  it('createApp returns an Express application', async () => {
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.handle).toBe('function');
  });

  it('mounts all route groups under /api and exposes health ping', async () => {
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const ping = await request(app).get('/api/health/ping');
    expect(ping.status).toBe(200);
    expect(ping.body).toMatchObject({ success: true, data: { message: 'pong' } });

    const client = await request(app).get('/api/sessions/demo/client/contacts');
    expect([401, 404, 503]).toContain(client.status);

    const messages = await request(app).post('/api/sessions/demo/messages/info').send({});
    expect([401, 400, 404, 503]).toContain(messages.status);
  });

  it('applies middleware order with auth/rate-limit before protected routes', async () => {
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const unauthenticated = await request(app).get('/api/sessions');
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body).toMatchObject({ success: false, error: expect.stringContaining('API key') });

    const authenticated = await request(app).get('/api/sessions').set('x-api-key', 'test-api-key');
    expect(authenticated.status).not.toBe(401);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const response = await request(app).get('/api/does-not-exist').set('x-api-key', 'test-api-key');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Route not found',
    });
  });

  it('graceful shutdown terminates all sessions and closes transports', async () => {
    getAllSessionsMock.mockReturnValue([{ id: 'a' }, { id: 'b' }]);
    terminateSessionMock.mockResolvedValue(undefined);

    const { createShutdownHandler } = await import('../src/index.js');

    const closeServerMock = vi.fn((callback?: (error?: Error) => void) => {
      callback?.();
    });

    const exitMock = vi.fn();
    const shutdown = createShutdownHandler({ close: closeServerMock } as any, exitMock);
    await shutdown('SIGTERM');

    expect(terminateSessionMock).toHaveBeenCalledTimes(2);
    expect(closeAllSseMock).toHaveBeenCalledTimes(1);
    expect(closeWsMock).toHaveBeenCalledTimes(1);
    expect(closeServerMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(0);
  });
});
