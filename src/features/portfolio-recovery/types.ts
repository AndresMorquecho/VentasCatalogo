/**
 * Portfolio Recovery Analysis - Frontend Types
 * 
 * TypeScript types for portfolio recovery analytics.
 * These types match the backend domain types for consistency.
 */

// Import pagination types first
import type { Pagination, PaginationMeta, PaginatedResult } from './pagination.types';

// Re-export for convenience
export type { Pagination, PaginationMeta, PaginatedResult };

// ============================================================================
// RECOVERY STATUS TYPES
// ============================================================================

/**
 * Recovery status classification based on recovery rate thresholds
 */
export type RecoveryStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

/**
 * Alert type classification
 */
export type AlertType = 'LOW_RECOVERY_BRAND' | 'OLD_ORDER' | 'LATE_PAYMENT_PATTERN';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Alert status for tracking resolution
 */
export type AlertStatus = 'NEW' | 'REVIEWED' | 'RESOLVED';

/**
 * Entity types that can be related to alerts
 */
export type RelatedEntityType = 'BRAND' | 'CLIENT' | 'ORDER';

// ============================================================================
// BRAND RECOVERY METRICS
// ============================================================================

/**
 * Breakdown of individual orders for a brand
 */
export interface OrderDetail {
  orderId: string;
  receiptNumber: string;
  clientName: string;
  total: number;
  totalPaid: number;
  outstanding: number;
  daysInWarehouse: number;
  receptionDate: string; // ISO date string
}

/**
 * Brand-level recovery metrics
 */
export interface BrandRecoveryMetrics {
  brandId: string;
  brandName: string;
  totalInWarehouse: number;
  totalRecovered: number;
  totalOutstanding: number;
  recoveryRate: number;
  orderCount: number;
  avgDaysInWarehouse: number;
  recoveryStatus: RecoveryStatus;
  orders?: OrderDetail[];
}

// ============================================================================
// CLIENT RECOVERY METRICS
// ============================================================================

/**
 * Brand breakdown for a specific client
 */
export interface BrandBreakdown {
  brandId: string;
  brandName: string;
  total: number;
  orderCount: number;
}

/**
 * Payment record for client history
 */
export interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  reference?: string;
  createdAt: string; // ISO date string
}

/**
 * Client-level recovery metrics
 */
export interface ClientRecoveryMetrics {
  clientId: string;
  clientName: string;
  totalInWarehouse: number;
  totalRecovered: number;
  recoveryRate: number;
  orderCount: number;
  brandBreakdown: BrandBreakdown[];
  paymentHistory: PaymentRecord[];
  isHighRisk: boolean;
}

// ============================================================================
// RECOVERY TRENDS
// ============================================================================

/**
 * Time period grouping options for trend analysis
 */
export type TrendGroupBy = 'DAY' | 'WEEK' | 'MONTH';

/**
 * Recovery trend data point for a specific time period
 */
export interface RecoveryTrend {
  period: string; // ISO date string or period label
  totalInWarehouse: number;
  totalRecovered: number;
  recoveryRate: number;
  orderCount: number;
}

// ============================================================================
// RECOVERY ALERTS
// ============================================================================

/**
 * Recovery alert for critical situations requiring attention
 */
export interface RecoveryAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  suggestedAction: string;
  relatedEntityId: string;
  relatedEntityType: RelatedEntityType;
  createdAt: string; // ISO date string
  status: AlertStatus;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Global filters for portfolio recovery queries
 */
export interface RecoveryFilters {
  dateFrom?: Date;
  dateTo?: Date;
  brandIds?: string[];
  clientIds?: string[];
  recoveryStatus?: RecoveryStatus | 'ALL';
  minDaysInWarehouse?: number;
  minAmount?: number;
}

/**
 * Filter state for UI (with string dates for form inputs)
 */
export interface FilterState {
  dateFrom?: string; // YYYY-MM-DD format
  dateTo?: string; // YYYY-MM-DD format
  brandIds?: string[];
  clientIds?: string[];
  recoveryStatus?: RecoveryStatus | 'ALL';
  minDaysInWarehouse?: string;
  minAmount?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
}

/**
 * Brand metrics API response
 */
export type BrandMetricsResponse = ApiResponse<PaginatedResult<BrandRecoveryMetrics>>;

/**
 * Client metrics API response
 */
export type ClientMetricsResponse = ApiResponse<PaginatedResult<ClientRecoveryMetrics>>;

/**
 * Trends API response
 */
export type TrendsResponse = ApiResponse<RecoveryTrend[]>;

/**
 * Alerts API response
 */
export type AlertsResponse = ApiResponse<RecoveryAlert[]>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert FilterState (UI) to RecoveryFilters (API)
 */
export function filterStateToRecoveryFilters(state: FilterState): RecoveryFilters {
  return {
    dateFrom: state.dateFrom ? new Date(state.dateFrom) : undefined,
    dateTo: state.dateTo ? new Date(state.dateTo) : undefined,
    brandIds: state.brandIds,
    clientIds: state.clientIds,
    recoveryStatus: state.recoveryStatus,
    minDaysInWarehouse: state.minDaysInWarehouse ? parseInt(state.minDaysInWarehouse) : undefined,
    minAmount: state.minAmount ? parseFloat(state.minAmount) : undefined,
  };
}

/**
 * Convert RecoveryFilters (API) to FilterState (UI)
 */
export function recoveryFiltersToFilterState(filters: RecoveryFilters): FilterState {
  return {
    dateFrom: filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : undefined,
    dateTo: filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : undefined,
    brandIds: filters.brandIds,
    clientIds: filters.clientIds,
    recoveryStatus: filters.recoveryStatus,
    minDaysInWarehouse: filters.minDaysInWarehouse?.toString(),
    minAmount: filters.minAmount?.toString(),
  };
}

/**
 * Get recovery status color for UI
 */
export function getRecoveryStatusColor(status: RecoveryStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'HEALTHY':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
      };
    case 'WARNING':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
      };
    case 'CRITICAL':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
      };
  }
}

/**
 * Get alert severity color for UI
 */
export function getAlertSeverityColor(severity: AlertSeverity): {
  bg: string;
  text: string;
  icon: string;
} {
  switch (severity) {
    case 'HIGH':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: 'text-red-500',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: 'text-yellow-500',
      };
    case 'LOW':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: 'text-blue-500',
      };
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-DO').format(value);
}
