/**
 * Portfolio Recovery Analysis - useBrandsList Hook
 * 
 * React Query hook for fetching list of brands for filter dropdowns.
 */

import { useQuery } from '@tanstack/react-query';
import { portfolioRecoveryApi } from '../api/portfolioRecoveryApi';

/**
 * Hook for fetching brands list
 * 
 * @returns Query result with brands list
 */
export function useBrandsList() {
  return useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['portfolio', 'brands', 'list'],
    queryFn: () => portfolioRecoveryApi.getBrandsList(),
    staleTime: 5 * 60 * 1000, // 5 minutes - brands don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    retry: 2,
  });
}
