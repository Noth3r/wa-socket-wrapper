import { Response } from 'express';
import { createLogger } from '../logger.js';
import type { SessionId } from '../types/index.js';

const logger = createLogger('SSEManager');

interface SSEClient {
  sessionId: SessionId;
  response: Response;
  lastEventId: number;
}

interface SSEEvent {
  type: string;
  data: unknown;
}

/**
 * SSEManager handles Server-Sent Events (SSE) for QR code and authentication status streaming
 * Manages per-session subscribers with automatic cleanup
 */
export class SSEManager {
  private subscribers: Map<SessionId, Set<Response>>;

  constructor() {
    this.subscribers = new Map();
  }

  /**
   * Subscribe a client to SSE events for a session
   * Sets up SSE headers and keeps connection alive
   */
  subscribe(sessionId: SessionId, res: Response): void {
    logger.info({ sessionId }, 'SSE client subscribed');

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Add to subscribers
    if (!this.subscribers.has(sessionId)) {
      this.subscribers.set(sessionId, new Set());
    }
    this.subscribers.get(sessionId)!.add(res);

    // Send initial comment to establish connection
    res.write(': SSE connection established\n\n');

    // Handle client disconnect
    res.on('close', () => {
      this.unsubscribe(sessionId, res);
    });

    res.on('error', (error) => {
      logger.error({ sessionId, error: error.message }, 'SSE connection error');
      this.unsubscribe(sessionId, res);
    });
  }

  /**
   * Unsubscribe a client from SSE events
   */
  private unsubscribe(sessionId: SessionId, res: Response): void {
    logger.info({ sessionId }, 'SSE client unsubscribed');

    const sessionSubscribers = this.subscribers.get(sessionId);
    if (sessionSubscribers) {
      sessionSubscribers.delete(res);
      if (sessionSubscribers.size === 0) {
        this.subscribers.delete(sessionId);
        logger.debug({ sessionId }, 'SSE session deleted - no subscribers');
      }
    }

    if (!res.writableEnded) {
      res.end();
    }
  }

  /**
   * Send QR code event to all subscribers of a session
   */
  sendQRCode(sessionId: SessionId, qrCode: string): void {
    this.sendEvent(sessionId, 'qr', { qr: qrCode });
  }

  /**
   * Send authentication status event to all subscribers of a session
   */
  sendAuthStatus(sessionId: SessionId, status: 'authenticated' | 'disconnected' | 'error', message?: string): void {
    this.sendEvent(sessionId, 'auth', { status, message });

    // Close connections on auth success or disconnect
    if (status === 'authenticated' || status === 'disconnected') {
      this.closeSession(sessionId);
    }
  }

  /**
   * Send connection status event to all subscribers of a session
   */
  sendConnectionStatus(sessionId: SessionId, status: string, message?: string): void {
    this.sendEvent(sessionId, 'connection', { status, message });
  }

  /**
   * Send generic event to all subscribers of a session
   */
  sendEvent(sessionId: SessionId, eventType: string, data: unknown): void {
    const sessionSubscribers = this.subscribers.get(sessionId);
    if (!sessionSubscribers || sessionSubscribers.size === 0) {
      logger.debug({ sessionId, eventType }, 'No SSE subscribers for event');
      return;
    }

    const event: SSEEvent = {
      type: eventType,
      data,
    };

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    let sentCount = 0;

    for (const res of Array.from(sessionSubscribers)) {
      if (!res.writableEnded) {
        try {
          res.write(payload);
          sentCount++;
        } catch (error) {
          logger.error({ sessionId, error: (error as Error).message }, 'Error sending SSE event');
          this.unsubscribe(sessionId, res);
        }
      }
    }

    logger.debug({ sessionId, eventType, subscribers: sentCount }, 'SSE event sent');
  }

  /**
   * Close all SSE connections for a session
   */
  closeSession(sessionId: SessionId): void {
    const sessionSubscribers = this.subscribers.get(sessionId);
    if (!sessionSubscribers) {
      return;
    }

    logger.info({ sessionId, subscribers: sessionSubscribers.size }, 'Closing SSE session');

    for (const res of Array.from(sessionSubscribers)) {
      if (!res.writableEnded) {
        res.end();
      }
    }

    this.subscribers.delete(sessionId);
  }

  /**
   * Close all SSE connections
   */
  closeAll(): void {
    logger.info('Closing all SSE connections');

    for (const [sessionId, sessionSubscribers] of Array.from(this.subscribers.entries())) {
      for (const res of Array.from(sessionSubscribers)) {
        if (!res.writableEnded) {
          res.end();
        }
      }
    }

    this.subscribers.clear();
  }

  /**
   * Get number of subscribers for a session
   */
  getSubscriberCount(sessionId: SessionId): number {
    return this.subscribers.get(sessionId)?.size || 0;
  }

  /**
   * Get total number of subscribers
   */
  getTotalSubscriberCount(): number {
    let total = 0;
    for (const sessionSubscribers of Array.from(this.subscribers.values())) {
      total += sessionSubscribers.size;
    }
    return total;
  }

  /**
   * Check if a session has active subscribers
   */
  hasSubscribers(sessionId: SessionId): boolean {
    const sessionSubscribers = this.subscribers.get(sessionId);
    return sessionSubscribers ? sessionSubscribers.size > 0 : false;
  }
}

export default SSEManager;
