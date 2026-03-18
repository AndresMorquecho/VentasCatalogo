/**
 * Portfolio Recovery Analysis - usePortfolioFilters Hook
 * 
 * Manages filter state with URL synchronization and debouncing.
 * Persists filters in URL query parameters for shareable links.
 * 
 * Requirements: 5.7, 5.8, 5.9
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { RecoveryFilters, FilterState } from '@/features/portfolio-recovery/types';
import { filterStateToRecoveryFilters } from '@/features/portfolio-recovery/types';

/**
 * Parse URL search params to filter state
 */
function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  const filters: FilterState = {};

  const dateFrom = searchParams.get('dateFrom');
  if (dateFrom) filters.dateFrom = dateFrom;

  const dateTo = searchParams.get('dateTo');
  if (dateTo) filters.dateTo = dateTo;

  const brandIds = searchParams.get('brandIds');
  if (brandIds) filters.brandIds = brandIds.split(',');

  const clientIds = searchParams.get('clientIds');
  if (clientIds) filters.clientIds = clientIds.split(',');

  const recoveryStatus = searchParams.get('recoveryStatus');
  if (recoveryStatus) filters.recoveryStatus = recoveryStatus as any;

  const minDaysInWarehouse = searchParams.get('minDaysInWarehouse');
  if (minDaysInWarehouse) filters.minDaysInWarehouse = minDaysInWarehouse;

  const minAmount = searchParams.get('minAmount');
  if (minAmount) filters.minAmount = minAmount;

  return filters;
}

/**
 * Serialize filter state to URL search params
 */
function serializeFiltersToURL(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.brandIds?.length) params.set('brandIds', filters.brandIds.join(','));
  if (filters.clientIds?.length) params.set('clientIds', filters.clientIds.join(','));
  if (filters.recoveryStatus) params.set('recoveryStatus', filters.recoveryStatus);
  if (filters.minDaysInWarehouse) params.set('minDaysInWarehouse', filters.minDaysInWarehouse);
  if (filters.minAmount) params.set('minAmount', filters.minAmount);

  return params;
}

/**
 * Hook for managing portfolio filters with URL sync and debouncing
 * 
 * @returns Filter state and update functions
 */
export function usePortfolioFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL
  const [filterState, setFilterState] = useState<FilterState>(() => 
    parseFiltersFromURL(searchParams)
  );

  // Debounce timer ref
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Sync filters to URL (debounced for text inputs)
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      const params = serializeFiltersToURL(filterState);
      setSearchParams(params, { replace: true });
    }, 300); // 300ms debounce

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [filterState]);

  /**
   * Update filters (immediate for non-text inputs)
   */
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update filters with immediate URL sync (for dropdowns, dates, etc.)
   */
  const updateFiltersImmediate = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => {
      const newState = { ...prev, ...updates };
      const params = serializeFiltersToURL(newState);
      setSearchParams(params, { replace: true });
      return newState;
    });
  }, [setSearchParams]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilterState({});
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  /**
   * Convert filter state to RecoveryFilters for API calls
   */
  const filters: RecoveryFilters = filterStateToRecoveryFilters(filterState);

  return {
    filterState,
    filters,
    updateFilters,
    updateFiltersImmediate,
    clearFilters,
  };
}
