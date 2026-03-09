import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

/**
 * API Key Authentication Middleware
 * 
 * Validates x-api-key header against configured API_KEY.
 * If API_KEY is not configured, allows all requests through.
 * 
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const configuredApiKey = process.env.API_KEY;

  // If API_KEY is not configured, skip authentication
  if (!configuredApiKey) {
    return next();
  }

  const providedApiKey = req.headers['x-api-key'];

  // Check if API key is provided
  if (!providedApiKey) {
    sendError(res, 403, 'API key required');
    return;
  }

  // Validate API key
  if (providedApiKey !== configuredApiKey) {
    sendError(res, 403, 'Invalid API key');
    return;
  }

  // API key is valid, proceed
  next();
}
