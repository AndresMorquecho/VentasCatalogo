/**
 * Portfolio Recovery Analysis - API Client
 * 
 * Provides functions to interact with the portfolio recovery backend API.
 * Handles request serialization, response deserialization, and error handling.
 * 
 * Requirements: 1.1, 10.1
 */

import { httpClient } from '../../../shared/lib/httpClient';
import type {
  BrandMetricsResponse,
  ClientMetricsResponse,
  TrendsResponse,
  AlertsResponse,
  RecoveryFilters,
  BrandRecoveryMetrics,
  ClientRecoveryMetrics,
  RecoveryTrend,
  RecoveryAlert,
  TrendGroupBy,
  AlertStatus,
} from '@/features/portfolio-recovery/types';
import type { Pagination, PaginatedResult } from '@/features/portfolio-recovery/pagination.types';

/**
 * Serialize recovery filters to query parameters
 */
function serializeFilters(filters: RecoveryFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.dateFrom) {
    params.append('dateFrom', filters.dateFrom.toISOString());
  }

  if (filters.dateTo) {
    params.append('dateTo', filters.dateTo.toISOString());
  }

  if (filters.brandIds && filters.brandIds.length > 0) {
    params.append('brandIds', filters.brandIds.join(','));
  }

  if (filters.clientIds && filters.clientIds.length > 0) {
    params.append('clientIds', filters.clientIds.join(','));
  }

  if (filters.recoveryStatus) {
    params.append('recoveryStatus', filters.recoveryStatus);
  }

  if (filters.minDaysInWarehouse !== undefined) {
    params.append('minDaysInWarehouse', filters.minDaysInWarehouse.toString());
  }

  if (filters.minAmount !== undefined) {
    params.append('minAmount', filters.minAmount.toString());
  }

  return params;
}

/**
 * Portfolio Recovery API Client
 */
export const portfolioRecoveryApi = {
  /**
   * Get brand-level recovery metrics
   * 
   * @param filters - Recovery filters to apply
   * @param pagination - Pagination parameters
   * @returns Paginated brand recovery metrics
   */
  getBrandMetrics: async (
    filters: RecoveryFilters,
    pagination: Pagination
  ): Promise<PaginatedResult<BrandRecoveryMetrics>> => {
    const params = serializeFilters(filters);
    params.append('page', pagination.page.toString());
    params.append('pageSize', pagination.pageSize.toString());

    const queryString = params.toString();
    const endpoint = `/portfolio/brands${queryString ? `?${queryString}` : ''}`;

    console.log('[PortfolioRecoveryApi] GET', endpoint);

    const response = await httpClient.get<BrandMetricsResponse>(endpoint);

    // Handle paginated response structure
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as PaginatedResult<BrandRecoveryMetrics>;
    }

    // Fallback if response is already the data
    return response as unknown as PaginatedResult<BrandRecoveryMetrics>;
  },

  /**
   * Get client-level recovery metrics
   * 
   * @param filters - Recovery filters to apply
   * @param pagination - Pagination parameters
   * @returns Paginated client recovery metrics
   */
  getClientMetrics: async (
    filters: RecoveryFilters,
    pagination: Pagination
  ): Promise<PaginatedResult<ClientRecoveryMetrics>> => {
    const params = serializeFilters(filters);
    params.append('page', pagination.page.toString());
    params.append('pageSize', pagination.pageSize.toString());

    const queryString = params.toString();
    const endpoint = `/portfolio/clients${queryString ? `?${queryString}` : ''}`;

    console.log('[PortfolioRecoveryApi] GET', endpoint);

    const response = await httpClient.get<ClientMetricsResponse>(endpoint);

    // Handle paginated response structure
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as PaginatedResult<ClientRecoveryMetrics>;
    }

    return response as unknown as PaginatedResult<ClientRecoveryMetrics>;
  },

  /**
   * Get recovery trends over time
   * 
   * @param filters - Recovery filters to apply
   * @param groupBy - Time period grouping (DAY, WEEK, MONTH)
   * @returns Array of recovery trends
   */
  getRecoveryTrends: async (
    filters: RecoveryFilters,
    groupBy: TrendGroupBy
  ): Promise<RecoveryTrend[]> => {
    const params = serializeFilters(filters);
    params.append('groupBy', groupBy);

    const queryString = params.toString();
    const endpoint = `/portfolio/trends${queryString ? `?${queryString}` : ''}`;

    console.log('[PortfolioRecoveryApi] GET', endpoint);

    const response = await httpClient.get<TrendsResponse>(endpoint);

    // Handle response structure
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as RecoveryTrend[];
    }

    return response as unknown as RecoveryTrend[];
  },

  /**
   * Get recovery alerts
   * 
   * @param filters - Recovery filters to apply
   * @returns Array of recovery alerts
   */
  getAlerts: async (filters: RecoveryFilters): Promise<RecoveryAlert[]> => {
    const params = serializeFilters(filters);

    const queryString = params.toString();
    const endpoint = `/portfolio/alerts${queryString ? `?${queryString}` : ''}`;

    console.log('[PortfolioRecoveryApi] GET', endpoint);

    const response = await httpClient.get<AlertsResponse>(endpoint);

    // Handle response structure
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as RecoveryAlert[];
    }

    return response as unknown as RecoveryAlert[];
  },

  /**
   * Update alert status
   * 
   * @param alertId - ID of the alert to update
   * @param status - New status (REVIEWED or RESOLVED)
   */
  updateAlertStatus: async (alertId: string, status: AlertStatus): Promise<void> => {
    const endpoint = `/portfolio/alerts/${alertId}`;

    console.log('[PortfolioRecoveryApi] PATCH', endpoint, { status });

    await httpClient.patch(endpoint, { status });
  },
};
