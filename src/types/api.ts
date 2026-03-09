/**
 * API Response Types
 * Defines standardized response structures for API endpoints
 */

/**
 * Standard API response wrapper for success
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationInfo {
  offset: number; // Offset in the result set
  limit: number; // Number of items per page
  total: number; // Total items available
}

/**
 * Paginated API response
 * Extends ApiResponse with pagination metadata
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination: PaginationInfo;
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse<T>(
  response: ApiResponse<T> | PaginatedResponse<T>
): response is PaginatedResponse<T> {
  return 'pagination' in response;
}
