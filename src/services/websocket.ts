import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { createLogger } from '../logger.js';
import { config } from '../config.js';
import type { SessionId } from '../types/index.js';

const logger = createLogger('WebSocketManager');

interface WebSocketMessage {
  sessionId: string;
  event: string;
  data: unknown;
  timestamp: number;
}

/**
 * WebSocketManager handles WebSocket connections for real-time event broadcasting
 * Manages per-session rooms with automatic cleanup and keepalive
 */
export class WebSocketManager {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<WebSocket>>;
  private pingIntervals: Map<WebSocket, NodeJS.Timeout>;

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.rooms = new Map();
    this.pingIntervals = new Map();

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  /**
   * Handle HTTP upgrade requests for WebSocket connections
   * Parses sessionId from URL path: ws://host/ws/:sessionId
   */
  handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer): void {
    if (!config.ENABLE_WEBSOCKET) {
      logger.warn('WebSocket connection rejected - ENABLE_WEBSOCKET is false');
      socket.destroy();
      return;
    }

    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const pathParts = url.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 1];

    if (!sessionId || sessionId === 'ws') {
      logger.warn({ path: url.pathname }, 'WebSocket connection rejected - no sessionId');
      socket.destroy();
      return;
    }

    logger.debug({ sessionId }, 'WebSocket upgrade request');

    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request, sessionId);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage, sessionId: string): void {
    logger.info({ sessionId }, 'WebSocket connection established');

    // Add client to session room
    if (!this.rooms.has(sessionId)) {
      this.rooms.set(sessionId, new Set());
    }
    this.rooms.get(sessionId)!.add(ws);

    // Setup ping/pong keepalive (30s interval)
    this.setupKeepalive(ws, sessionId);

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnect(ws, sessionId);
    });

    ws.on('error', (error) => {
      logger.error({ sessionId, error: error.message }, 'WebSocket error');
      this.handleDisconnect(ws, sessionId);
    });

    // Handle pong responses
    ws.on('pong', () => {
      logger.debug({ sessionId }, 'WebSocket pong received');
    });
  }

  /**
   * Setup ping/pong keepalive mechanism
   */
  private setupKeepalive(ws: WebSocket, sessionId: string): void {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
        logger.debug({ sessionId }, 'WebSocket ping sent');
      }
    }, 30000); // 30 seconds

    this.pingIntervals.set(ws, interval);
  }

  /**
   * Handle client disconnect and cleanup
   */
  private handleDisconnect(ws: WebSocket, sessionId: string): void {
    logger.info({ sessionId }, 'WebSocket connection closed');

    // Clear keepalive interval
    const interval = this.pingIntervals.get(ws);
    if (interval) {
      clearInterval(interval);
      this.pingIntervals.delete(ws);
    }

    // Remove from room
    const room = this.rooms.get(sessionId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(sessionId);
        logger.debug({ sessionId }, 'WebSocket room deleted - no clients');
      }
    }
  }

  /**
   * Broadcast event to all clients in a session room
   */
  broadcast(sessionId: SessionId, event: string, data: unknown): void {
    const room = this.rooms.get(sessionId);
    if (!room || room.size === 0) {
      logger.debug({ sessionId, event }, 'No WebSocket clients to broadcast to');
      return;
    }

    const message: WebSocketMessage = {
      sessionId,
      event,
      data,
      timestamp: Date.now(),
    };

    const payload = JSON.stringify(message);
    let sentCount = 0;

    for (const ws of Array.from(room)) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
        sentCount++;
      }
    }

    logger.debug({ sessionId, event, clients: sentCount }, 'WebSocket event broadcasted');
  }

  /**
   * Close all connections for a session
   */
  closeSession(sessionId: SessionId): void {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return;
    }

    logger.info({ sessionId, clients: room.size }, 'Closing WebSocket session');

    for (const ws of Array.from(room)) {
      ws.close();
    }

    this.rooms.delete(sessionId);
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    logger.info('Closing WebSocket server');

    // Clear all keepalive intervals
    for (const interval of Array.from(this.pingIntervals.values())) {
      clearInterval(interval);
    }
    this.pingIntervals.clear();

    // Close all client connections
    for (const room of Array.from(this.rooms.values())) {
      for (const ws of Array.from(room)) {
        ws.close();
      }
    }
    this.rooms.clear();

    // Close WebSocket server
    return new Promise((resolve, reject) => {
      this.wss.close((err) => {
        if (err) {
          logger.error({ error: err.message }, 'Error closing WebSocket server');
          reject(err);
        } else {
          logger.info('WebSocket server closed');
          resolve();
        }
      });
    });
  }

  /**
   * Get number of connected clients for a session
   */
  getClientCount(sessionId: SessionId): number {
    return this.rooms.get(sessionId)?.size || 0;
  }

  /**
   * Get total number of connected clients
   */
  getTotalClientCount(): number {
    let total = 0;
    for (const room of Array.from(this.rooms.values())) {
      total += room.size;
    }
    return total;
  }
}

export const webSocketManager = new WebSocketManager();

export default WebSocketManager;
