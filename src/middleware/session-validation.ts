import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

/**
 * Session ID Format Validation Middleware
 * 
 * Validates that sessionId parameter matches expected format:
 * - Alphanumeric characters (a-z, A-Z, 0-9)
 * - Hyphens (-)
 * - Underscores (_)
 * 
 * Rejects with 400 Bad Request if format is invalid.
 */
export function validateSessionId(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.params.sessionId as string;

  // Check if sessionId exists
  if (!sessionId) {
    sendError(res, 400, 'Session ID is required');
    return;
  }

  // Validate format using regex: alphanumeric, hyphens, underscores only
  const sessionIdRegex = /^[\w-]+$/;
  
  if (!sessionIdRegex.test(sessionId)) {
    sendError(res, 400, 'Invalid session ID format. Only alphanumeric characters, hyphens, and underscores are allowed');
    return;
  }

  // Format is valid, proceed
  next();
}

/**
 * Creates middleware to validate session exists in session manager
 * 
 * @param sessionManager Session manager instance with getSession method
 * @returns Express middleware function
 */
export function createValidateSessionExists(sessionManager: any) {
  return function validateSessionExists(req: Request, res: Response, next: NextFunction): void {
    const { sessionId } = req.params;

    const session = sessionManager.getSession(sessionId);

    if (!session) {
      sendError(res, 404, `Session '${sessionId}' not found`);
      return;
    }

    // Session exists, proceed
    next();
  };
}

/**
 * Creates middleware to validate session is connected
 * 
 * @param sessionManager Session manager instance with isConnected method
 * @returns Express middleware function
 */
export function createValidateSessionConnected(sessionManager: any) {
  return function validateSessionConnected(req: Request, res: Response, next: NextFunction): void {
    const { sessionId } = req.params;

    const isConnected = sessionManager.isConnected(sessionId);

    if (!isConnected) {
      sendError(res, 503, `Session '${sessionId}' is not connected`);
      return;
    }

    // Session is connected, proceed
    next();
  };
}
