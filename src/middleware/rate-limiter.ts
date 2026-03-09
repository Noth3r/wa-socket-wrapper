import rateLimit from 'express-rate-limit';
import config from '../config.js';

/**
 * Rate Limiter Middleware
 * 
 * Limits the number of requests from a single IP address
 * using configuration from environment variables.
 * 
 * Responds with 429 Too Many Requests when limit exceeded.
 */
export const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
    });
  },
});
