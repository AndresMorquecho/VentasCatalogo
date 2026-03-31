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
    <div className="min-h-screen bg-[#fcfaff]">
      {/* Page Header */}
      <div className="px-4 lg:px-12 pt-12">
        <PageHeader
          title="Recuperación de Cartera"
          description="Monitoreo estratégico y gestión operativa de recaudos por marca."
          icon={Wallet}
        />
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-12 pt-8 pb-12 space-y-12">
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
