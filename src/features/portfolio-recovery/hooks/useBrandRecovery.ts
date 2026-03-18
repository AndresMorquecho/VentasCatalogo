/**
 * Portfolio Recovery Analysis - useBrandRecovery Hook
 * 
 * React Query hook for fetching brand-level recovery metrics.
 * Provides caching, loading states, and error handling.
 * 
 * Requirements: 1.1, 12.1, 12.2
 */

import { useQuery } from '@tanstack/react-query';
import { portfolioKeys } from '../lib/queryKeys';
import { portfolioRecoveryApi } from '../api/portfolioRecoveryApi';
import type { RecoveryFilters, BrandRecoveryMetrics } from '@/features/portfolio-recovery/types';
import type { Pagination, PaginatedResult } from '@/features/portfolio-recovery/pagination.types';

/**
 * Hook options
 */
interface UseBrandRecoveryOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook for fetching brand recovery metrics
 * 
 * @param filters - Recovery filters to apply
 * @param pagination - Pagination parameters
 * @param options - Additional query options
 * @returns Query result with brand metrics data
 */
export function useBrandRecovery(
  filters: RecoveryFilters,
  pagination: Pagination,
  options?: UseBrandRecoveryOptions
) {
  return useQuery<PaginatedResult<BrandRecoveryMetrics>>({
    queryKey: portfolioKeys.brands(filters, pagination),
    queryFn: () => portfolioRecoveryApi.getBrandMetrics(filters, pagination),
    staleTime: 60 * 1000, // 1 minute - data is considered fresh for 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes - cache time (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    // Use placeholder data to show stale data while refetching
    placeholderData: (previousData) => previousData,
  });
}
