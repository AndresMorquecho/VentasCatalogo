/**
 * Portfolio Recovery Analysis - Pagination Types
 * 
 * Separate file for pagination types to avoid module resolution issues.
 */

/**
 * Pagination parameters for queries
 */
export interface Pagination {
  page: number;
  pageSize: number;
}

/**
 * Metadata about pagination state
 */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Generic paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}
