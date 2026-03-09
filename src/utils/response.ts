import { Response } from 'express';

/**
 * Pagination metadata for list responses
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Success response format
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Send a success response
 * @param res Express response object
 * @param data Response data
 * @param statusCode HTTP status code (default: 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<SuccessResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error response
 * @param res Express response object
 * @param statusCode HTTP status code
 * @param message Error message
 * @param details Optional error details
 */
export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown
): Response<ErrorResponse & { details?: unknown }> {
  const errorResponse: ErrorResponse & { details?: unknown } = {
    success: false,
    error: message,
  };
  
  if (details) {
    errorResponse.details = details;
  }
  
  return res.status(statusCode).json(errorResponse);
}

/**
 * Send a paginated response
 * @param res Express response object
 * @param data Array of data items
 * @param pagination Pagination metadata
 * @param statusCode HTTP status code (default: 200)
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMetadata,
  statusCode: number = 200
): Response<PaginatedResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
}
