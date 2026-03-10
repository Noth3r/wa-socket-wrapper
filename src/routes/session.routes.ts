import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { validateSessionId } from '../middleware/session-validation.js';
import {
  getAllSessions,
  startSession,
  stopSession,
  getSessionStatus,
  getQRJson,
  getQRImage,
  streamQRCode,
  requestPairingCode,
  restartSession,
  deleteSession,
  deleteInactiveSessions,
  deleteAllSessions,
} from '../controllers/session.controller.js';

const router = Router();

/**
 * Get all sessions
 * GET /api/sessions
 */
router.get('/', asyncHandler(getAllSessions));

/**
 * Start a new session
 * POST /api/sessions/:sessionId/start
 */
router.post('/:sessionId/start', validateSessionId, asyncHandler(startSession));

/**
 * Stop a session
 * POST /api/sessions/:sessionId/stop
 */
router.post('/:sessionId/stop', validateSessionId, asyncHandler(stopSession));

/**
 * Get session status
 * GET /api/sessions/:sessionId/status
 */
router.get('/:sessionId/status', validateSessionId, asyncHandler(getSessionStatus));

/**
 * Get QR code as JSON
 * GET /api/sessions/:sessionId/qr
 */
router.get('/:sessionId/qr', validateSessionId, asyncHandler(getQRJson));

/**
 * Get QR code as PNG image
 * GET /api/sessions/:sessionId/qr/image
 */
router.get('/:sessionId/qr/image', validateSessionId, asyncHandler(getQRImage));

/**
 * Stream QR code updates via SSE
 * GET /api/sessions/:sessionId/qr/stream
 */
router.get('/:sessionId/qr/stream', validateSessionId, asyncHandler(streamQRCode));

/**
 * Request pairing code for phone number
 * POST /api/sessions/:sessionId/pairing-code
 */
router.post('/:sessionId/pairing-code', validateSessionId, asyncHandler(requestPairingCode));

/**
 * Restart a session
 * POST /api/sessions/:sessionId/restart
 */
router.post('/:sessionId/restart', validateSessionId, asyncHandler(restartSession));

/**
 * Delete/terminate a specific session
 * DELETE /api/sessions/:sessionId
 */
router.delete('/:sessionId', validateSessionId, asyncHandler(deleteSession));

/**
 * Delete all inactive sessions
 * DELETE /api/sessions/inactive
 * Must be before /:sessionId routes to match before parameterized route
 */
router.delete('/inactive', asyncHandler(deleteInactiveSessions));

/**
 * Delete all sessions
 * DELETE /api/sessions
 */
router.delete('/', asyncHandler(deleteAllSessions));

export default router;
