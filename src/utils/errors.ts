import { Request, Response, NextFunction } from 'express';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 400 Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 401 Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * 404 Session not found error
 */
export class SessionNotFoundError extends AppError {
  constructor(sessionId: string, details?: unknown) {
    super(
      `Session '${sessionId}' not found`,
      404,
      'SESSION_NOT_FOUND',
      details
    );
    Object.setPrototypeOf(this, SessionNotFoundError.prototype);
  }
}

/**
 * 503 Session not connected error
 */
export class SessionNotConnectedError extends AppError {
  constructor(sessionId: string, details?: unknown) {
    super(
      `Session '${sessionId}' is not connected`,
      503,
      'SESSION_NOT_CONNECTED',
      details
    );
    Object.setPrototypeOf(this, SessionNotConnectedError.prototype);
  }
}

/**
 * Async route handler wrapper that catches errors and passes them to Express error handler
 * @param fn Express route handler function
 * @returns Express route handler with error handling
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
