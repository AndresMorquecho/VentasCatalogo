/**
 * Portfolio Recovery Analysis - PortfolioRecoveryPage
 * 
 * Dashboard simplificado para análisis de recuperación de cartera.
 * Muestra métricas generales y desglose por marca con gráficos visuales.
 */

import { PageHeader } from '@/shared/ui/PageHeader';
import { Wallet } from 'lucide-react';
import { GlobalFilters } from './GlobalFilters';
import { BrandAnalyticsTab } from './BrandAnalyticsTab';
import { usePortfolioFilters } from '../hooks/usePortfolioFilters';

/**
 * Main portfolio recovery dashboard
 */
export function PortfolioRecoveryPage() {
  const { 
    filterState, 
    filters, 
    updateFilters, 
    updateFiltersImmediate, 
    clearFilters 
  } = usePortfolioFilters();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <PageHeader
        title="Análisis de Recuperación de Cartera"
        description="Monitoreo y gestión de recuperación de pagos por marca"
        icon={Wallet}
      />

      {/* Main Content */}
      <div className="px-6 pt-4 pb-6 space-y-3">
        {/* Global Filters */}
        <GlobalFilters
          filterState={filterState}
          onFiltersChange={updateFilters}
          onFiltersChangeImmediate={updateFiltersImmediate}
          onClearFilters={clearFilters}
        />

        {/* Dashboard Content */}
        <BrandAnalyticsTab filters={filters} />
      </div>
    </div>
  );
}
