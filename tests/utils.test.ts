import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Response } from 'express';

import {
  sendSuccess,
  sendError,
  sendPaginated,
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  SessionNotFoundError,
  SessionNotConnectedError,
  asyncHandler,
  normalizeJid,
  isGroupJid,
  isNewsletterJid,
  extractPhoneNumber,
} from '../src/utils/index';

// ============================================================================
// Response Utilities Tests
// ============================================================================

describe('Response Utilities', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('sendSuccess', () => {
    it('should return success response with default status code 200', () => {
      const testData = { userId: 123, name: 'Test User' };
      sendSuccess(mockResponse as Response, testData);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
      });
    });

    it('should return success response with custom status code', () => {
      const testData = { id: 1 };
      sendSuccess(mockResponse as Response, testData, 201);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
      });
    });

    it('should handle array data', () => {
      const testData = [{ id: 1 }, { id: 2 }];
      sendSuccess(mockResponse as Response, testData);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
      });
    });
  });

  describe('sendError', () => {
    it('should return error response with status code and message', () => {
      sendError(mockResponse as Response, 400, 'Validation error');

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
      });
    });

    it('should include details when provided', () => {
      const errorDetails = { field: 'email', reason: 'invalid format' };
      sendError(mockResponse as Response, 400, 'Invalid input', errorDetails);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
        details: errorDetails,
      });
    });

    it('should handle 500 error status', () => {
      sendError(mockResponse as Response, 500, 'Internal server error');

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('sendPaginated', () => {
    it('should return paginated response with data and pagination metadata', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, limit: 10, total: 100, totalPages: 10 };

      sendPaginated(mockResponse as Response, items, pagination);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: items,
        pagination,
      });
    });

    it('should accept custom status code', () => {
      const items: unknown[] = [];
      const pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

      sendPaginated(mockResponse as Response, items, pagination, 201);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });
});

// ============================================================================
// Error Classes Tests
// ============================================================================

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create AppError with message and default status 500', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error).toBeInstanceOf(Error);
    });

    it('should set custom statusCode and code', () => {
      const error = new AppError('Custom error', 418, 'CUSTOM_CODE');

      expect(error.statusCode).toBe(418);
      expect(error.code).toBe('CUSTOM_CODE');
    });

    it('should include details when provided', () => {
      const details = { userId: 123 };
      const error = new AppError('Error with details', 400, 'ERROR', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should have statusCode 404', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should use default message when not provided', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Not found');
    });
  });

  describe('ValidationError', () => {
    it('should have statusCode 400', () => {
      const error = new ValidationError('Invalid email');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should use default message when not provided', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Validation failed');
    });
  });

  describe('AuthenticationError', () => {
    it('should have statusCode 401', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should use default message when not provided', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Authentication failed');
    });
  });

  describe('SessionNotFoundError', () => {
    it('should have statusCode 404 and include sessionId in message', () => {
      const error = new SessionNotFoundError('session-123');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('SESSION_NOT_FOUND');
      expect(error.message).toContain('session-123');
    });
  });

  describe('SessionNotConnectedError', () => {
    it('should have statusCode 503 and include sessionId in message', () => {
      const error = new SessionNotConnectedError('session-456');

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SESSION_NOT_CONNECTED');
      expect(error.message).toContain('session-456');
    });
  });

  describe('asyncHandler', () => {
    it('should wrap async function and catch errors', async () => {
      const mockNext = vi.fn();
      const testError = new Error('Async error');
      const asyncFn = vi.fn().mockRejectedValue(testError);

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn({} as any, {} as any, mockNext);

      // Allow promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should call next on successful async function', async () => {
      const mockNext = vi.fn();
      const asyncFn = vi.fn().mockResolvedValue(undefined);

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn({} as any, {} as any, mockNext);

      // Allow promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// JID Utilities Tests
// ============================================================================

describe('JID Utilities', () => {
  describe('normalizeJid', () => {
    it('should normalize simple phone number to WhatsApp JID', () => {
      const result = normalizeJid('6281234567890');

      expect(result).toBe('6281234567890@s.whatsapp.net');
    });

    it('should normalize phone number with + prefix', () => {
      const result = normalizeJid('+6281234567890');

      expect(result).toBe('6281234567890@s.whatsapp.net');
    });

    it('should normalize phone number with dashes', () => {
      const result = normalizeJid('+62-812-3456-7890');

      expect(result).toBe('6281234567890@s.whatsapp.net');
    });

    it('should normalize phone number with spaces', () => {
      const result = normalizeJid('62 812 3456 7890');

      expect(result).toBe('6281234567890@s.whatsapp.net');
    });

    it('should normalize phone number with parentheses', () => {
      const result = normalizeJid('+62 (812) 3456-7890');

      expect(result).toBe('6281234567890@s.whatsapp.net');
    });

    it('should preserve group JID format', () => {
      const result = normalizeJid('120363012345@g.us');

      expect(result).toBe('120363012345@g.us');
    });

    it('should preserve newsletter JID format', () => {
      const result = normalizeJid('123456789@newsletter');

      expect(result).toBe('123456789@newsletter');
    });

    it('should throw error on empty input', () => {
      expect(() => normalizeJid('')).toThrow();
    });

    it('should throw error on invalid phone number (too short)', () => {
      expect(() => normalizeJid('12345')).toThrow('Invalid phone number');
    });

    it('should throw error on non-string input', () => {
      expect(() => normalizeJid(null as any)).toThrow();
    });
  });

  describe('isGroupJid', () => {
    it('should return true for group JID', () => {
      const result = isGroupJid('120363012345@g.us');

      expect(result).toBe(true);
    });

    it('should return false for user JID', () => {
      const result = isGroupJid('6281234567890@s.whatsapp.net');

      expect(result).toBe(false);
    });

    it('should return false for newsletter JID', () => {
      const result = isGroupJid('123456789@newsletter');

      expect(result).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(isGroupJid('')).toBe(false);
      expect(isGroupJid(null as any)).toBe(false);
    });
  });

  describe('isNewsletterJid', () => {
    it('should return true for newsletter JID', () => {
      const result = isNewsletterJid('123456789@newsletter');

      expect(result).toBe(true);
    });

    it('should return false for user JID', () => {
      const result = isNewsletterJid('6281234567890@s.whatsapp.net');

      expect(result).toBe(false);
    });

    it('should return false for group JID', () => {
      const result = isNewsletterJid('120363012345@g.us');

      expect(result).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(isNewsletterJid('')).toBe(false);
      expect(isNewsletterJid(null as any)).toBe(false);
    });
  });

  describe('extractPhoneNumber', () => {
    it('should extract phone from WhatsApp user JID', () => {
      const result = extractPhoneNumber('6281234567890@s.whatsapp.net');

      expect(result).toBe('6281234567890');
    });

    it('should extract phone from group JID', () => {
      const result = extractPhoneNumber('120363012345@g.us');

      expect(result).toBe('120363012345');
    });

    it('should throw error on empty input', () => {
      expect(() => extractPhoneNumber('')).toThrow();
    });

    it('should extract phone from string without @ symbol', () => {
      const result = extractPhoneNumber('not-a-jid');

      expect(result).toBe('not-a-jid');
    });

    it('should throw error on non-string input', () => {
      expect(() => extractPhoneNumber(null as any)).toThrow();
    });
  });
});
