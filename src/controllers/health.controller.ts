import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

/**
 * Health check endpoint
 * @returns { success: true, message: 'pong' }
 */
export async function pingHandler(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { message: 'pong' });
}
