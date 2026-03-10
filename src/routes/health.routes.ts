import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { pingHandler } from '../controllers/health.controller.js';

const router = Router();

/**
 * Health check endpoint
 * GET /ping
 */
router.get('/ping', asyncHandler(pingHandler));

export default router;
