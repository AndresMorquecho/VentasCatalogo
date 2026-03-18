/**
 * Portfolio Recovery Analysis - Query Keys Factory
 * 
 * Provides consistent query keys for React Query caching and invalidation.
 * Following the query key factory pattern for better cache management.
 * 
 * Requirements: 12.1, 12.4
 */

import type { RecoveryFilters, TrendGroupBy } from '@/features/portfolio-recovery/types';
import type { Pagination } from '@/features/portfolio-recovery/pagination.types';
import { queryClient } from '@shared/lib/queryClient';

/**
 * Portfolio recovery query keys factory
 * 
 * Hierarchical structure:
 * - portfolioKeys.all: ['portfolio'] - Invalidates all portfolio queries
 * - portfolioKeys.brands(): ['portfolio', 'brands'] - All brand queries
 * - portfolioKeys.brands(filters, pagination): ['portfolio', 'brands', filters, pagination] - Specific brand query
 */
export const portfolioKeys = {
  /**
   * Base key for all portfolio queries
   */
  all: ['portfolio'] as const,

  /**
   * All brand metrics queries
   */
  brandsAll: () => [...portfolioKeys.all, 'brands'] as const,

  /**
   * Specific brand metrics query with filters and pagination
   */
  brands: (filters: RecoveryFilters, pagination: Pagination) =>
    [...portfolioKeys.brandsAll(), filters, pagination] as const,

  /**
   * Brand detail query (for expanded view)
   */
  brandDetail: (brandId: string, filters: RecoveryFilters) =>
    [...portfolioKeys.brandsAll(), 'detail', brandId, filters] as const,

  /**
   * All client metrics queries
   */
  clientsAll: () => [...portfolioKeys.all, 'clients'] as const,

  /**
   * Specific client metrics query with filters and pagination
   */
  clients: (filters: RecoveryFilters, pagination: Pagination) =>
    [...portfolioKeys.clientsAll(), filters, pagination] as const,

  /**
   * Client detail query (for expanded view)
   */
  clientDetail: (clientId: string, filters: RecoveryFilters) =>
    [...portfolioKeys.clientsAll(), 'detail', clientId, filters] as const,

  /**
   * All trends queries
   */
  trendsAll: () => [...portfolioKeys.all, 'trends'] as const,

  /**
   * Specific trends query with filters and grouping
   */
  trends: (filters: RecoveryFilters, groupBy: TrendGroupBy) =>
    [...portfolioKeys.trendsAll(), filters, groupBy] as const,

  /**
   * All alerts queries
   */
  alertsAll: () => [...portfolioKeys.all, 'alerts'] as const,

  /**
   * Specific alerts query with filters
   */
  alerts: (filters: RecoveryFilters) =>
    [...portfolioKeys.alertsAll(), filters] as const,
};

/**
 * Invalidate all portfolio cache
 * 
 * Use when data changes that affect all portfolio queries
 * (e.g., new payment recorded, order status changed)
 */
export function invalidatePortfolioCache() {
  queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
  console.log('[Portfolio] Cache invalidated for all portfolio queries');
}

/**
 * Invalidate brand metrics cache
 * 
 * Use when data changes that affect brand metrics specifically
 */
export function invalidateBrandMetricsCache() {
  queryClient.invalidateQueries({ queryKey: portfolioKeys.brandsAll() });
  console.log('[Portfolio] Cache invalidated for brand metrics');
}

/**
 * Invalidate client metrics cache
 * 
 * Use when data changes that affect client metrics specifically
 */
export function invalidateClientMetricsCache() {
  queryClient.invalidateQueries({ queryKey: portfolioKeys.clientsAll() });
  console.log('[Portfolio] Cache invalidated for client metrics');
}

/**
 * Invalidate trends cache
 * 
 * Use when data changes that affect trends
 */
export function invalidateTrendsCache() {
  queryClient.invalidateQueries({ queryKey: portfolioKeys.trendsAll() });
  console.log('[Portfolio] Cache invalidated for trends');
}

/**
 * Invalidate alerts cache
 * 
 * Use when alerts are updated or new alerts are generated
 */
export function invalidateAlertsCache() {
  queryClient.invalidateQueries({ queryKey: portfolioKeys.alertsAll() });
  console.log('[Portfolio] Cache invalidated for alerts');
}

/**
 * Prefetch brand metrics
 * 
 * Use for optimistic prefetching (e.g., on tab hover)
 */
export async function prefetchBrandMetrics(
  filters: RecoveryFilters,
  pagination: Pagination,
  fetcher: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: portfolioKeys.brands(filters, pagination),
    queryFn: fetcher,
    staleTime: 60 * 1000, // 1 minute
  });
  console.log('[Portfolio] Prefetched brand metrics');
}

/**
 * Prefetch client metrics
 * 
 * Use for optimistic prefetching (e.g., on tab hover)
 */
export async function prefetchClientMetrics(
  filters: RecoveryFilters,
  pagination: Pagination,
  fetcher: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: portfolioKeys.clients(filters, pagination),
    queryFn: fetcher,
    staleTime: 60 * 1000, // 1 minute
  });
  console.log('[Portfolio] Prefetched client metrics');
}

/**
 * Prefetch trends
 * 
 * Use for optimistic prefetching (e.g., on tab hover)
 */
export async function prefetchTrends(
  filters: RecoveryFilters,
  groupBy: TrendGroupBy,
  fetcher: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: portfolioKeys.trends(filters, groupBy),
    queryFn: fetcher,
    staleTime: 60 * 1000, // 1 minute
  });
  console.log('[Portfolio] Prefetched trends');
}

/**
 * Prefetch alerts
 * 
 * Use for optimistic prefetching (e.g., on tab hover)
 */
export async function prefetchAlerts(
  filters: RecoveryFilters,
  fetcher: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: portfolioKeys.alerts(filters),
    queryFn: fetcher,
    staleTime: 60 * 1000, // 1 minute
  });
  console.log('[Portfolio] Prefetched alerts');
}
