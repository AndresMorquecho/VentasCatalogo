/**
 * Portfolio Recovery Analysis - usePortfolioFilters Hook
 * 
 * Manages filter state with URL synchronization and debouncing.
 * Persists filters in URL query parameters for shareable links.
 * 
 * Requirements: 5.7, 5.8, 5.9
 */

import { useState, useCallback, useMemo } from 'react';
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

  // Use brand name in URL instead of IDs for cleaner URLs
  const brand = searchParams.get('marca');
  if (brand) {
    filters.brandName = brand;
  }

  const clientIds = searchParams.get('clientIds');
  if (clientIds) filters.clientIds = clientIds.split(',');

  const recoveryStatus = searchParams.get('estado');
  if (recoveryStatus) filters.recoveryStatus = recoveryStatus as any;

  const minDaysInWarehouse = searchParams.get('minDaysInWarehouse');
  if (minDaysInWarehouse) filters.minDaysInWarehouse = minDaysInWarehouse;

  const minAmount = searchParams.get('minAmount');
  if (minAmount) filters.minAmount = minAmount;

  return filters;
}

/**
 * Serialize filter state to URL search params
 * Uses friendly names instead of IDs for cleaner URLs
 */
function serializeFiltersToURL(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  
  // Use brand name in URL instead of IDs for cleaner, shareable URLs
  if (filters.brandName) {
    params.set('marca', filters.brandName);
  }
  
  if (filters.clientIds?.length) params.set('clientIds', filters.clientIds.join(','));
  
  // Use Spanish parameter name for recovery status
  if (filters.recoveryStatus && filters.recoveryStatus !== 'ALL') {
    params.set('estado', filters.recoveryStatus);
  }
  
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

  /**
   * Update filters (debounced for text inputs)
   */
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
    
    // Debounced URL sync
    setTimeout(() => {
      setFilterState(current => {
        const params = serializeFiltersToURL(current);
        setSearchParams(params, { replace: true });
        return current;
      });
    }, 300);
  }, [setSearchParams]);

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
  const filters: RecoveryFilters = useMemo(
    () => filterStateToRecoveryFilters(filterState),
    [filterState]
  );

  return {
    filterState,
    filters,
    updateFilters,
    updateFiltersImmediate,
    clearFilters,
  };
}
