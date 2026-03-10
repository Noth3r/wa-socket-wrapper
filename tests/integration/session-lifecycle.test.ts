import http from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { createSessionId } from '../../src/types/index.js';
import {
  createTestApp,
  getMockedBaileys,
  getMockedFs,
  getSocketBySessionId,
  resetIntegrationState,
} from './test-helpers.js';

describe('Integration: session lifecycle scenarios', { timeout: 10000 }, () => {
  beforeEach(async () => {
    process.env.RATE_LIMIT_MAX = '3';
    process.env.RATE_LIMIT_WINDOW_MS = '1000';
    await resetIntegrationState();
  });

  afterEach(async () => {
    await resetIntegrationState();
  });

  it('1) session create + QR flow via SSE', async () => {
    const { app, apiKey } = await createTestApp();
    const { sseManager } = await import('../../src/services/sse.js');
    const sessionId = 'sse-qr-flow';

    await request(app).post(`/api/sessions/${sessionId}/start`).set('x-api-key', apiKey).send({}).expect(201);

    const sseServer = http.createServer(app);
    await new Promise<void>((resolve) => sseServer.listen(0, '127.0.0.1', () => resolve()));

    try {
      const address = sseServer.address();
      const port = typeof address === 'object' && address ? address.port : 0;

      const ssePayloadPromise = new Promise<string>((resolve, reject) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port,
            path: `/api/sessions/${sessionId}/qr/stream`,
            method: 'GET',
            headers: { 'x-api-key': apiKey },
          },
          (res) => {
            try {
              expect(String(res.headers['content-type'] ?? '')).toContain('text/event-stream');
            } catch (error) {
              reject(error);
              return;
            }

            res.setEncoding('utf8');
            let raw = '';
            let done = false;

            sseManager.sendQRCode(createSessionId(sessionId), 'qr-integration-code');

            res.on('data', (chunk: string) => {
              if (done) {
                return;
              }

              raw += chunk;
              if (raw.includes('data: ')) {
                const lines = raw.split('\n').filter((line) => line.startsWith('data: '));
                const lastDataLine = lines.length > 0 ? lines[lines.length - 1] : undefined;
                if (lastDataLine) {
                  done = true;
                  resolve(lastDataLine.replace('data: ', '').trim());
                  sseManager.sendAuthStatus(createSessionId(sessionId), 'authenticated');
                }
              }
            });

            res.on('error', reject);
          },
        );

        req.on('error', reject);
        req.end();
      });

      const payload = JSON.parse(await ssePayloadPromise) as { type: string; data: { qr: string } };

      expect(payload.type).toBe('qr');
      expect(payload.data.qr).toBe('qr-integration-code');
    } finally {
      await new Promise<void>((resolve) => sseServer.close(() => resolve()));
    }
  });

  it('2) multi-session isolation (2 sessions with separate states)', async () => {
    const { app, apiKey } = await createTestApp();

    await request(app).post('/api/sessions/alice/start').set('x-api-key', apiKey).send({}).expect(201);
    await request(app).post('/api/sessions/bob/start').set('x-api-key', apiKey).send({}).expect(201);

    const aliceSocket = getSocketBySessionId('alice');
    const bobSocket = getSocketBySessionId('bob');

    expect(aliceSocket).toBeDefined();
    expect(bobSocket).toBeDefined();

    aliceSocket!.ev.emit('connection.update', { qr: 'alice-qr-only' });

    const aliceStatus = await request(app).get('/api/sessions/alice/status').set('x-api-key', apiKey).expect(200);
    const bobStatus = await request(app).get('/api/sessions/bob/status').set('x-api-key', apiKey).expect(200);

    expect(aliceStatus.body.success).toBe(true);
    expect(aliceStatus.body.data.status).toBe('qr_ready');
    expect(aliceStatus.body.data.qr).toBe('alice-qr-only');
    expect(bobStatus.body.success).toBe(true);
    expect(bobStatus.body.data.status).toBe('starting');
    expect(bobStatus.body.data.qr).toBeUndefined();
  });

  it('3) session stop + restart with reconnection', async () => {
    const { app, apiKey } = await createTestApp();
    const mockedBaileys = await getMockedBaileys();

    await request(app).post('/api/sessions/reconnect/start').set('x-api-key', apiKey).send({}).expect(201);

    const socket = getSocketBySessionId('reconnect');
    expect(socket).toBeDefined();

    socket!.ev.emit('connection.update', {
      connection: 'close',
      lastDisconnect: { error: { output: { statusCode: 500 } } },
    });

    await vi.waitFor(
      () => {
        expect(mockedBaileys.makeWASocket).toHaveBeenCalledTimes(2);
      },
      { timeout: 3000 },
    );

    await request(app).post('/api/sessions/reconnect/stop').set('x-api-key', apiKey).expect(200);
    await request(app).post('/api/sessions/reconnect/start').set('x-api-key', apiKey).send({}).expect(201);

    await vi.waitFor(() => {
      expect(mockedBaileys.makeWASocket).toHaveBeenCalledTimes(3);
    });
  });

  it('4) session terminate with cleanup', async () => {
    const { app, apiKey } = await createTestApp();
    const mockedFs = await getMockedFs();

    await request(app).post('/api/sessions/cleanup/start').set('x-api-key', apiKey).send({}).expect(201);
    const socket = getSocketBySessionId('cleanup');

    await request(app).delete('/api/sessions/cleanup').set('x-api-key', apiKey).expect(200);

    expect(socket?.logout).toHaveBeenCalledOnce();
    expect(mockedFs.rm).toHaveBeenCalled();
  });

  it('5) list sessions endpoint verification', async () => {
    const { app, apiKey } = await createTestApp();

    await request(app).post('/api/sessions/list-a/start').set('x-api-key', apiKey).send({}).expect(201);
    await request(app).post('/api/sessions/list-b/start').set('x-api-key', apiKey).send({}).expect(201);

    const response = await request(app).get('/api/sessions').set('x-api-key', apiKey).expect(200);

    expect(response.body).toMatchObject({ success: true });
    expect(Array.isArray(response.body.data)).toBe(true);

    const ids = (response.body.data as Array<{ id: string }>).map((item) => item.id);
    expect(ids).toContain('list-a');
    expect(ids).toContain('list-b');
  });

  it('6) webhook delivery with mock HTTP server', async () => {
    const { app, apiKey } = await createTestApp();
    const { webhookDispatcher } = await import('../../src/services/webhook.js');
    const received: Array<{ sessionId: string; event: string; data: unknown }> = [];

    const hookServer = http.createServer((req, res) => {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        received.push(JSON.parse(body));
        res.statusCode = 200;
        res.end('ok');
      });
    });

    await new Promise<void>((resolve) => hookServer.listen(0, '127.0.0.1', () => resolve()));

    try {
      const address = hookServer.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const webhookUrl = `http://127.0.0.1:${port}/webhook`;

      await request(app)
        .post('/api/sessions/hook/start')
        .set('x-api-key', apiKey)
        .send({ webhookUrl })
        .expect(201);

      await webhookDispatcher.dispatch('hook', 'messages.upsert', { messages: [{ key: { id: 'm-1' } }] }, { webhookUrl });

      await vi.waitFor(
        () => {
          expect(received.length).toBeGreaterThan(0);
        },
        { timeout: 2000 },
      );

      expect(received[0]).toMatchObject({
        sessionId: 'hook',
        event: 'messages.upsert',
        data: { messages: [{ key: { id: 'm-1' } }] },
      });
    } finally {
      await new Promise<void>((resolve) => hookServer.close(() => resolve()));
    }
  });

  it('7) WebSocket events over /ws', async () => {
    process.env.ENABLE_WEBSOCKET = 'true';
    process.env.API_KEY = 'test-api-key';
    vi.resetModules();
    const { startServer } = await import('../../src/server.js');
    const { webSocketManager } = await import('../../src/services/websocket.js');

    const server = startServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    try {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/ws-live?apiKey=test-api-key`);

      await new Promise<void>((resolve, reject) => {
        ws.once('open', () => resolve());
        ws.once('error', reject);
      });

      const messagePromise = new Promise<{ event: string; data: { ping: boolean } }>((resolve, reject) => {
        ws.once('message', (buffer) => {
          try {
            resolve(JSON.parse(buffer.toString()));
          } catch (error) {
            reject(error);
          }
        });
      });

      webSocketManager.broadcast(createSessionId('ws-live'), 'messages.upsert', { ping: true });

      const event = await messagePromise;
      expect(event.event).toBe('messages.upsert');
      expect(event.data).toEqual({ ping: true });

      ws.close();
    } finally {
      await webSocketManager.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('8) rate limiting (429 responses)', async () => {
    const prevMax = process.env.RATE_LIMIT_MAX;
    const prevWindow = process.env.RATE_LIMIT_WINDOW_MS;
    process.env.RATE_LIMIT_MAX = '1';
    process.env.RATE_LIMIT_WINDOW_MS = '10000';
    const { app, apiKey } = await createTestApp();

    await request(app).get('/api/sessions').set('x-api-key', apiKey).expect(200);
    const second = await request(app).get('/api/sessions').set('x-api-key', apiKey).expect(429);

    expect(second.body).toMatchObject({
      success: false,
      error: 'Too many requests, please try again later',
    });

    process.env.RATE_LIMIT_MAX = prevMax;
    process.env.RATE_LIMIT_WINDOW_MS = prevWindow;
  });

  it('9) error propagation (invalid session ID)', async () => {
    const { app, apiKey } = await createTestApp();

    const notFound = await request(app).get('/api/sessions/missing/status').set('x-api-key', apiKey).expect(404);
    expect(notFound.body).toMatchObject({ success: false, error: expect.any(String) });

    const missingApiKey = await request(app).get('/api/sessions').expect(403);
    expect(missingApiKey.body).toMatchObject({ success: false, error: expect.any(String) });

    const malformedBody = await request(app)
      .post('/api/sessions/missing/pairing-code')
      .set('x-api-key', apiKey)
      .send({})
      .expect(400);
    expect(malformedBody.body).toMatchObject({ success: false, error: expect.any(String) });
  });
});
