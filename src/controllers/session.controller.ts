import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';
import { sessionManager } from '../services/session-manager.js';
import { sseManager } from '../services/sse.js';
import { webhookDispatcher } from '../services/webhook.js';
import { ValidationError, SessionNotFoundError } from '../utils/errors.js';
import type { SessionId } from '../types/index.js';
import { createSessionId } from '../types/index.js';
import qrcode from 'qrcode';

// Helper to extract sessionId from params
function getSessionId(req: Request): string {
  const sessionId = req.params.sessionId;
  if (typeof sessionId !== 'string') {
    throw new ValidationError('Invalid session ID');
  }
  return sessionId;
}

/**
 * Get all sessions
 * GET /api/sessions
 */
export async function getAllSessions(req: Request, res: Response): Promise<void> {
  const sessions = sessionManager.getAllSessions();
  sendSuccess(res, sessions);
}

/**
 * Start a new session
 * POST /api/sessions/:sessionId/start
 * Body: { webhookUrl?, webhookEvents? }
 */
export async function startSession(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const { webhookUrl, webhookEvents } = req.body;

  const sessionInfo = await sessionManager.startSession(sessionId, {
    webhookUrl,
    webhookEvents,
  });

  sendSuccess(res, sessionInfo, 201);
}

/**
 * Stop a session
 * POST /api/sessions/:sessionId/stop
 */
export async function stopSession(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);

  await sessionManager.stopSession(sessionId);
  sendSuccess(res, { message: 'Session stopped' });
}

/**
 * Get session status
 * GET /api/sessions/:sessionId/status
 */
export async function getSessionStatus(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);

  const sessionInfo = sessionManager.getSessionInfo(sessionId);
  if (!sessionInfo) {
    throw new SessionNotFoundError(sessionId);
  }

  sendSuccess(res, sessionInfo);
}

/**
 * Get QR code as JSON
 * GET /api/sessions/:sessionId/qr
 */
export async function getQRJson(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);

  const session = sessionManager.getSession(sessionId);
  if (!session.qr) {
    throw new ValidationError('QR code not available. Session may be already connected or in disconnected state.');
  }

  sendSuccess(res, { qr: session.qr });
}

/**
 * Get QR code as PNG image
 * GET /api/sessions/:sessionId/qr/image
 */
export async function getQRImage(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);

  const session = sessionManager.getSession(sessionId);
  if (!session.qr) {
    throw new ValidationError('QR code not available. Session may be already connected or in disconnected state.');
  }

  const buffer = await qrcode.toBuffer(session.qr, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 300,
    margin: 1,
  });

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', buffer.length);
  res.end(buffer);
}

/**
 * Stream QR code updates via SSE
 * GET /api/sessions/:sessionId/qr/stream
 */
export async function streamQRCode(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);

  // Validate session exists
  sessionManager.getSession(sessionId);

  // Subscribe to SSE stream
  sseManager.subscribe(createSessionId(sessionId), res);
}

/**
 * Request pairing code for phone number
 * POST /api/sessions/:sessionId/pairing-code
 * Body: { phoneNumber }
 */
export async function requestPairingCode(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const { phoneNumber } = req.body;

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new ValidationError('phoneNumber is required');
  }

  const code = await sessionManager.requestPairingCode(sessionId, phoneNumber);
  sendSuccess(res, { pairingCode: code });
}

/**
 * Restart a session
 * POST /api/sessions/:sessionId/restart
 */
export async function restartSession(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);

  const sessionInfo = await sessionManager.restartSession(sessionId);
  sendSuccess(res, sessionInfo);
}

/**
 * Delete/terminate a specific session
 * DELETE /api/sessions/:sessionId
 */
export async function deleteSession(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);

  await sessionManager.terminateSession(sessionId);
  sendSuccess(res, { message: 'Session terminated' });
}

/**
 * Delete all inactive sessions
 * DELETE /api/sessions/inactive
 */
export async function deleteInactiveSessions(req: Request, res: Response): Promise<void> {
  const sessions = sessionManager.getAllSessions();
  const inactiveSessions = sessions.filter((s) => s.status !== 'connected');

  let terminatedCount = 0;
  for (const session of inactiveSessions) {
    try {
      await sessionManager.terminateSession(session.id as string);
      terminatedCount++;
    } catch (error) {
      // Log but continue
      console.error(`Failed to terminate session ${session.id}:`, error);
    }
  }

  sendSuccess(res, { terminatedCount, message: `${terminatedCount} inactive sessions terminated` });
}

/**
 * Delete all sessions
 * DELETE /api/sessions
 */
export async function deleteAllSessions(req: Request, res: Response): Promise<void> {
  const sessions = sessionManager.getAllSessions();

  let terminatedCount = 0;
  for (const session of sessions) {
    try {
      await sessionManager.terminateSession(session.id as string);
      terminatedCount++;
    } catch (error) {
      // Log but continue
      console.error(`Failed to terminate session ${session.id}:`, error);
    }
  }

  sendSuccess(res, { terminatedCount, message: `${terminatedCount} sessions terminated` });
}
