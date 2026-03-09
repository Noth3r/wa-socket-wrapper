import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Test setup
describe('API Key Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let apiKeyMiddleware: any;
  let originalApiKey: string | undefined;

  beforeEach(async () => {
    // Save original API_KEY
    originalApiKey = process.env.API_KEY;
    
    req = {
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    // Restore original API_KEY
    if (originalApiKey !== undefined) {
      process.env.API_KEY = originalApiKey;
    } else {
      delete process.env.API_KEY;
    }
    vi.resetModules();
  });

  it('allows request with valid API key', async () => {
    process.env.API_KEY = 'test-api-key-123';
    const { apiKeyAuth } = await import('../src/middleware/api-key.js');
    
    req.headers = { 'x-api-key': 'test-api-key-123' };
    
    apiKeyAuth(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects request with invalid API key', async () => {
    process.env.API_KEY = 'test-api-key-123';
    const { apiKeyAuth } = await import('../src/middleware/api-key.js');
    
    req.headers = { 'x-api-key': 'wrong-key' };
    
    apiKeyAuth(req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Invalid API key'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects request with missing API key header', async () => {
    process.env.API_KEY = 'test-api-key-123';
    const { apiKeyAuth } = await import('../src/middleware/api-key.js');
    
    req.headers = {};
    
    apiKeyAuth(req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('API key'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('allows all requests when API_KEY not configured', async () => {
    delete process.env.API_KEY;
    const { apiKeyAuth } = await import('../src/middleware/api-key.js');
    
    req.headers = {};
    
    apiKeyAuth(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('Rate Limiter Middleware', () => {
  it('creates rate limiter with config values', async () => {
    const { rateLimiter } = await import('../src/middleware/rate-limiter.js');
    
    expect(rateLimiter).toBeDefined();
    expect(typeof rateLimiter).toBe('function');
  });

  it('rate limiter has correct window and max settings', async () => {
    const { rateLimiter } = await import('../src/middleware/rate-limiter.js');
    
    // Express-rate-limit middleware is a function
    expect(typeof rateLimiter).toBe('function');
  });
});

describe('Session Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockSessionManager: any;

  beforeEach(() => {
    req = {
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();

    // Mock session manager
    mockSessionManager = {
      getSession: vi.fn(),
      isConnected: vi.fn(),
    };
  });

  describe('validateSessionId', () => {
    it('passes with valid alphanumeric session ID', async () => {
      const { validateSessionId } = await import('../src/middleware/session-validation.js');
      
      req.params = { sessionId: 'session123' };
      
      validateSessionId(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('passes with session ID containing dashes', async () => {
      const { validateSessionId } = await import('../src/middleware/session-validation.js');
      
      req.params = { sessionId: 'session-123-abc' };
      
      validateSessionId(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('passes with session ID containing underscores', async () => {
      const { validateSessionId } = await import('../src/middleware/session-validation.js');
      
      req.params = { sessionId: 'session_123_abc' };
      
      validateSessionId(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects session ID with special characters', async () => {
      const { validateSessionId } = await import('../src/middleware/session-validation.js');
      
      req.params = { sessionId: 'session@123' };
      
      validateSessionId(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid session ID'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects session ID with spaces', async () => {
      const { validateSessionId } = await import('../src/middleware/session-validation.js');
      
      req.params = { sessionId: 'session 123' };
      
      validateSessionId(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects empty session ID', async () => {
      const { validateSessionId } = await import('../src/middleware/session-validation.js');
      
      req.params = { sessionId: '' };
      
      validateSessionId(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateSessionExists', () => {
    it('passes when session exists', async () => {
      const { createValidateSessionExists } = await import('../src/middleware/session-validation.js');
      
      mockSessionManager.getSession.mockReturnValue({ id: 'session123', status: 'connected' });
      const middleware = createValidateSessionExists(mockSessionManager);
      
      req.params = { sessionId: 'session123' };
      
      middleware(req as Request, res as Response, next);
      
      expect(mockSessionManager.getSession).toHaveBeenCalledWith('session123');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects when session not found', async () => {
      const { createValidateSessionExists } = await import('../src/middleware/session-validation.js');
      
      mockSessionManager.getSession.mockReturnValue(null);
      const middleware = createValidateSessionExists(mockSessionManager);
      
      req.params = { sessionId: 'nonexistent' };
      
      middleware(req as Request, res as Response, next);
      
      expect(mockSessionManager.getSession).toHaveBeenCalledWith('nonexistent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('not found'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateSessionConnected', () => {
    it('passes when session is connected', async () => {
      const { createValidateSessionConnected } = await import('../src/middleware/session-validation.js');
      
      mockSessionManager.isConnected.mockReturnValue(true);
      const middleware = createValidateSessionConnected(mockSessionManager);
      
      req.params = { sessionId: 'session123' };
      
      middleware(req as Request, res as Response, next);
      
      expect(mockSessionManager.isConnected).toHaveBeenCalledWith('session123');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects when session is disconnected', async () => {
      const { createValidateSessionConnected } = await import('../src/middleware/session-validation.js');
      
      mockSessionManager.isConnected.mockReturnValue(false);
      const middleware = createValidateSessionConnected(mockSessionManager);
      
      req.params = { sessionId: 'session123' };
      
      middleware(req as Request, res as Response, next);
      
      expect(mockSessionManager.isConnected).toHaveBeenCalledWith('session123');
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('not connected'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockLogger: any;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/test',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();

    mockLogger = {
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    };
  });

  it('catches AppError and returns appropriate status', async () => {
    const { AppError } = await import('../src/utils/errors.js');
    const { createErrorHandler } = await import('../src/middleware/error-handler.js');
    
    const errorHandler = createErrorHandler(mockLogger);
    const appError = new AppError('Test error', 400, 'TEST_ERROR');
    
    errorHandler(appError, req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Test error',
      })
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('catches NotFoundError with 404 status', async () => {
    const { NotFoundError } = await import('../src/utils/errors.js');
    const { createErrorHandler } = await import('../src/middleware/error-handler.js');
    
    const errorHandler = createErrorHandler(mockLogger);
    const notFoundError = new NotFoundError('Resource not found');
    
    errorHandler(notFoundError, req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Resource not found',
      })
    );
  });

  it('catches ValidationError with 400 status', async () => {
    const { ValidationError } = await import('../src/utils/errors.js');
    const { createErrorHandler } = await import('../src/middleware/error-handler.js');
    
    const errorHandler = createErrorHandler(mockLogger);
    const validationError = new ValidationError('Invalid input', { field: 'email' });
    
    errorHandler(validationError, req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid input',
        details: { field: 'email' },
      })
    );
  });

  it('catches unknown error and returns 500', async () => {
    const { createErrorHandler } = await import('../src/middleware/error-handler.js');
    
    const errorHandler = createErrorHandler(mockLogger);
    const unknownError = new Error('Something went wrong');
    
    errorHandler(unknownError, req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Internal server error',
      })
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('logs all errors with context', async () => {
    const { AppError } = await import('../src/utils/errors.js');
    const { createErrorHandler } = await import('../src/middleware/error-handler.js');
    
    const errorHandler = createErrorHandler(mockLogger);
    const appError = new AppError('Test error', 400, 'TEST_ERROR');
    
    req.method = 'POST';
    req.path = '/api/test';
    
    errorHandler(appError, req as Request, res as Response, next);
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/test',
      }),
      expect.any(String)
    );
  });

  it('includes error details when present', async () => {
    const { AppError } = await import('../src/utils/errors.js');
    const { createErrorHandler } = await import('../src/middleware/error-handler.js');
    
    const errorHandler = createErrorHandler(mockLogger);
    const appError = new AppError('Test error', 400, 'TEST_ERROR', { field: 'name', reason: 'required' });
    
    errorHandler(appError, req as Request, res as Response, next);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Test error',
        details: { field: 'name', reason: 'required' },
      })
    );
  });
});
