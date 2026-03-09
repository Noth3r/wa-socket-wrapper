import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketManager } from '../../src/services/websocket.js';
import { SSEManager } from '../../src/services/sse.js';
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { Response } from 'express';
import { createSessionId } from '../../src/types/index.js';

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    wsManager = new WebSocketManager();
  });

  afterEach(async () => {
    await wsManager.close();
  });

  it('accepts connection and adds to room', () => {
    const sessionId = createSessionId('test-session');
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn(),
    } as unknown as WebSocket;
    const mockRequest = {} as IncomingMessage;

    // Simulate connection event
    (wsManager as any).handleConnection(mockWs, mockRequest, sessionId);

    expect(wsManager.getClientCount(sessionId)).toBe(1);
  });

  it('broadcasts event to all clients in room', () => {
    const sessionId = createSessionId('test-session');
    const sentMessages: string[] = [];

    // Create mock WebSocket clients
    const mockWs1 = {
      readyState: WebSocket.OPEN,
      send: vi.fn((data) => sentMessages.push(data)),
      on: vi.fn(),
      close: vi.fn(),
    } as unknown as WebSocket;

    const mockWs2 = {
      readyState: WebSocket.OPEN,
      send: vi.fn((data) => sentMessages.push(data)),
      on: vi.fn(),
      close: vi.fn(),
    } as unknown as WebSocket;

    const mockRequest = {} as IncomingMessage;

    // Add clients to room
    (wsManager as any).handleConnection(mockWs1, mockRequest, sessionId);
    (wsManager as any).handleConnection(mockWs2, mockRequest, sessionId);

    // Broadcast event
    wsManager.broadcast(sessionId, 'test-event', { message: 'hello' });

    // Verify both clients received the message
    expect(sentMessages).toHaveLength(2);
    expect(mockWs1.send).toHaveBeenCalledTimes(1);
    expect(mockWs2.send).toHaveBeenCalledTimes(1);

    // Verify message format
    const message = JSON.parse(sentMessages[0]);
    expect(message).toHaveProperty('sessionId', sessionId);
    expect(message).toHaveProperty('event', 'test-event');
    expect(message).toHaveProperty('data', { message: 'hello' });
    expect(message).toHaveProperty('timestamp');
  });

  it('removes client from room on disconnect', () => {
    const sessionId = createSessionId('test-session');
    let closeHandler: (() => void) | undefined;

    const mockWs = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      on: vi.fn((event, handler) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      }),
    } as unknown as WebSocket;

    const mockRequest = {} as IncomingMessage;

    // Add client to room
    (wsManager as any).handleConnection(mockWs, mockRequest, sessionId);
    expect(wsManager.getClientCount(sessionId)).toBe(1);

    // Trigger close event
    if (closeHandler) {
      closeHandler();
    }

    // Verify client was removed
    expect(wsManager.getClientCount(sessionId)).toBe(0);
  });

  it('respects ENABLE_WEBSOCKET config', async () => {
    const mockSocket = {
      destroy: vi.fn(),
    } as unknown as Socket;

    const mockRequest = {
      url: '/ws/test-session',
      headers: { host: 'localhost:3000' },
    } as IncomingMessage;

    const mockHead = Buffer.from('');

    // Mock config to disable WebSocket
    vi.mock('../../src/config.js', () => ({
      config: { ENABLE_WEBSOCKET: false }
    }));

    // Create new instance that will use mocked config
    const testWsManager = new WebSocketManager();

    // Attempt upgrade
    testWsManager.handleUpgrade(mockRequest, mockSocket, mockHead);

    // Verify socket was destroyed
    expect(mockSocket.destroy).toHaveBeenCalled();
    
    await testWsManager.close();
  });

  it('broadcasts to correct session only', () => {
    const session1 = createSessionId('session-1');
    const session2 = createSessionId('session-2');

    const mockWs1 = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn(),
    } as unknown as WebSocket;

    const mockWs2 = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn(),
    } as unknown as WebSocket;

    const mockRequest = {} as IncomingMessage;

    // Add clients to different rooms
    (wsManager as any).handleConnection(mockWs1, mockRequest, session1);
    (wsManager as any).handleConnection(mockWs2, mockRequest, session2);

    // Broadcast to session1 only
    wsManager.broadcast(session1, 'test-event', { data: 'test' });

    // Verify only session1 client received message
    expect(mockWs1.send).toHaveBeenCalledTimes(1);
    expect(mockWs2.send).not.toHaveBeenCalled();
  });

  it('closes session and all its connections', () => {
    const sessionId = createSessionId('test-session');

    const mockWs1 = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn(),
    } as unknown as WebSocket;

    const mockWs2 = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn(),
    } as unknown as WebSocket;

    const mockRequest = {} as IncomingMessage;

    // Add clients to room
    (wsManager as any).handleConnection(mockWs1, mockRequest, sessionId);
    (wsManager as any).handleConnection(mockWs2, mockRequest, sessionId);

    expect(wsManager.getClientCount(sessionId)).toBe(2);

    // Close session
    wsManager.closeSession(sessionId);

    // Verify both clients were closed
    expect(mockWs1.close).toHaveBeenCalled();
    expect(mockWs2.close).toHaveBeenCalled();
    expect(wsManager.getClientCount(sessionId)).toBe(0);
  });
});

describe('SSEManager', () => {
  let sseManager: SSEManager;

  beforeEach(() => {
    sseManager = new SSEManager();
  });

  afterEach(() => {
    sseManager.closeAll();
  });

  it('sets correct SSE headers on subscribe', () => {
    const sessionId = createSessionId('test-session');
    const headers: Record<string, string> = {};
    const writes: string[] = [];
    let closeHandler: (() => void) | undefined;

    const mockResponse = {
      setHeader: vi.fn((key, value) => {
        headers[key] = value;
      }),
      write: vi.fn((data) => writes.push(data)),
      on: vi.fn((event, handler) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      }),
      end: vi.fn(),
      writableEnded: false,
    } as unknown as Response;

    sseManager.subscribe(sessionId, mockResponse);

    // Verify headers
    expect(headers['Content-Type']).toBe('text/event-stream');
    expect(headers['Cache-Control']).toBe('no-cache');
    expect(headers['Connection']).toBe('keep-alive');
    expect(headers['X-Accel-Buffering']).toBe('no');

    // Verify initial comment was sent
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain('SSE connection established');

    // Verify subscriber was added
    expect(sseManager.getSubscriberCount(sessionId)).toBe(1);
  });

  it('sends QR events in SSE format', () => {
    const sessionId = createSessionId('test-session');
    const writes: string[] = [];

    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn((data) => writes.push(data)),
      on: vi.fn(),
      end: vi.fn(),
      writableEnded: false,
    } as unknown as Response;

    sseManager.subscribe(sessionId, mockResponse);

    // Clear initial connection message
    writes.length = 0;

    // Send QR code
    sseManager.sendQRCode(sessionId, 'qr-code-data');

    // Verify SSE format
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(/^data: /);
    expect(writes[0]).toMatch(/\n\n$/);

    // Parse event data
    const eventData = writes[0].replace('data: ', '').trim();
    const event = JSON.parse(eventData);

    expect(event).toHaveProperty('type', 'qr');
    expect(event).toHaveProperty('data', { qr: 'qr-code-data' });
  });

  it('sends auth status events', () => {
    const sessionId = createSessionId('test-session');
    const writes: string[] = [];

    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn((data) => writes.push(data)),
      on: vi.fn(),
      end: vi.fn(),
      writableEnded: false,
    } as unknown as Response;

    sseManager.subscribe(sessionId, mockResponse);
    writes.length = 0;

    // Send auth status
    sseManager.sendAuthStatus(sessionId, 'authenticated', 'Login successful');

    // Verify event
    expect(writes).toHaveLength(1);
    const eventData = writes[0].replace('data: ', '').trim();
    const event = JSON.parse(eventData);

    expect(event).toHaveProperty('type', 'auth');
    expect(event.data).toHaveProperty('status', 'authenticated');
    expect(event.data).toHaveProperty('message', 'Login successful');
  });

  it('closes connection on auth success', () => {
    const sessionId = createSessionId('test-session');

    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      on: vi.fn(),
      end: vi.fn(),
      writableEnded: false,
    } as unknown as Response;

    sseManager.subscribe(sessionId, mockResponse);
    expect(sseManager.getSubscriberCount(sessionId)).toBe(1);

    // Send authenticated status
    sseManager.sendAuthStatus(sessionId, 'authenticated');

    // Verify connection was closed
    expect(mockResponse.end).toHaveBeenCalled();
    expect(sseManager.getSubscriberCount(sessionId)).toBe(0);
  });

  it('removes subscriber on client disconnect', () => {
    const sessionId = createSessionId('test-session');
    let closeHandler: (() => void) | undefined;

    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      on: vi.fn((event, handler) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      }),
      end: vi.fn(),
      writableEnded: false,
    } as unknown as Response;

    sseManager.subscribe(sessionId, mockResponse);
    expect(sseManager.getSubscriberCount(sessionId)).toBe(1);

    // Trigger close event
    if (closeHandler) {
      closeHandler();
    }

    // Verify subscriber was removed
    expect(sseManager.getSubscriberCount(sessionId)).toBe(0);
  });

  it('sends events to correct session only', () => {
    const session1 = createSessionId('session-1');
    const session2 = createSessionId('session-2');

    const mockResponse1 = {
      setHeader: vi.fn(),
      write: vi.fn(),
      on: vi.fn(),
      end: vi.fn(),
      writableEnded: false,
    } as unknown as Response;

    const mockResponse2 = {
      setHeader: vi.fn(),
      write: vi.fn(),
      on: vi.fn(),
      end: vi.fn(),
      writableEnded: false,
    } as unknown as Response;

    sseManager.subscribe(session1, mockResponse1);
    sseManager.subscribe(session2, mockResponse2);

    // Clear initial writes
    (mockResponse1.write as any).mockClear();
    (mockResponse2.write as any).mockClear();

    // Send event to session1 only
    sseManager.sendQRCode(session1, 'qr-data');

    // Verify only session1 received the event
    expect(mockResponse1.write).toHaveBeenCalledTimes(1);
    expect(mockResponse2.write).not.toHaveBeenCalled();
  });
});
