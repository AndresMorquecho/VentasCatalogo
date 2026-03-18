/**
 * Portfolio Recovery Analysis - useRecoveryTrends Hook
 * 
 * React Query hook para obtener tendencias de recuperación.
 */

import { useQuery } from '@tanstack/react-query';
import { portfolioKeys } from '../lib/queryKeys';
import { portfolioRecoveryApi } from '../api/portfolioRecoveryApi';
import type { RecoveryFilters, TrendGroupBy, RecoveryTrend } from '@/features/portfolio-recovery/types';

interface UseRecoveryTrendsOptions {
  enabled?: boolean;
}

/**
 * Hook para obtener tendencias de recuperación
 */
export function useRecoveryTrends(
  filters: RecoveryFilters,
  groupBy: TrendGroupBy,
  options?: UseRecoveryTrendsOptions
) {
  return useQuery<RecoveryTrend[]>({
    queryKey: portfolioKeys.trends(filters, groupBy),
    queryFn: () => portfolioRecoveryApi.getRecoveryTrends(filters, groupBy),
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
  });
}
