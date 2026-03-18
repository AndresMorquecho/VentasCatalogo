/**
 * Portfolio Recovery Analysis - Public Exports
 * 
 * Main entry point for the portfolio recovery feature.
 */

// Main page component
export { PortfolioRecoveryPage } from './ui/PortfolioRecoveryPage';

// Types
export type {
  RecoveryFilters,
  BrandRecoveryMetrics,
  ClientRecoveryMetrics,
  RecoveryTrend,
  RecoveryAlert,
  RecoveryStatus,
} from './types';

// Hooks
export { useBrandRecovery } from './hooks/useBrandRecovery';
export { usePortfolioFilters } from './hooks/usePortfolioFilters';
export { useRecoveryTrends } from './hooks/useRecoveryTrends';

// API
export { portfolioRecoveryApi } from './api/portfolioRecoveryApi';

// Query keys for cache invalidation
export { 
  portfolioKeys,
  invalidatePortfolioCache,
  invalidateBrandMetricsCache,
} from './lib/queryKeys';
