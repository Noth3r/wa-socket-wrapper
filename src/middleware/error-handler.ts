import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import type { Logger } from 'pino';

/**
 * Creates Express error handler middleware
 * 
 * Catches all errors thrown in route handlers and converts them to
 * consistent JSON error responses.
 * 
 * - AppError instances: Use their statusCode and message
 * - Unknown errors: Return 500 Internal Server Error
 * - All errors are logged with request context
 * 
 * @param logger Pino logger instance
 * @returns Express error handler middleware
 */
export function createErrorHandler(logger: Logger) {
  const errorLogger = logger.child({ module: 'ErrorHandler' });

  return function errorHandler(
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Log error with request context
    const errorContext = {
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      statusCode: err instanceof AppError ? err.statusCode : 500,
    };

    errorLogger.error(errorContext, `Error handling request: ${err.message}`);

    // Handle AppError instances
    if (err instanceof AppError) {
      sendError(res, err.statusCode, err.message, err.details);
      return;
    }

    // Handle unknown errors
    sendError(res, 500, 'Internal server error');
  };
}
