/**
 * Portfolio Recovery Analysis - BrandAnalyticsTab Component
 * 
 * Dashboard con métricas generales y gráficos visuales de recuperación por marca.
 */

import { useState, useMemo } from 'react';
import { useBrandRecovery } from '../hooks/useBrandRecovery';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { EmptyState } from './EmptyState';
import { formatCurrency, formatPercentage } from '@/features/portfolio-recovery/types';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle } from 'lucide-react';
import type { RecoveryFilters } from '@/features/portfolio-recovery/types';

interface BrandAnalyticsTabProps {
  filters: RecoveryFilters;
}

/**
 * Dashboard de análisis por marca
 */
export function BrandAnalyticsTab({ filters }: BrandAnalyticsTabProps) {
  const [page] = useState(1);
  const pageSize = 100; // Traer más datos para el dashboard

  const { data, isLoading, error, refetch } = useBrandRecovery(
    filters,
    { page, pageSize }
  );

  // Calcular métricas totales
  const totals = useMemo(() => {
    if (!data || data.items.length === 0) return null;

    const totalInWarehouse = data.items.reduce((sum, b) => sum + b.totalInWarehouse, 0);
    const totalRecovered = data.items.reduce((sum, b) => sum + b.totalRecovered, 0);
    const totalOutstanding = data.items.reduce((sum, b) => sum + b.totalOutstanding, 0);
    const avgRecoveryRate = totalInWarehouse > 0 ? (totalRecovered / totalInWarehouse) * 100 : 0;
    const totalOrders = data.items.reduce((sum, b) => sum + b.orderCount, 0);

    // Contar marcas por estado
    const healthy = data.items.filter(b => b.recoveryStatus === 'HEALTHY').length;
    const warning = data.items.filter(b => b.recoveryStatus === 'WARNING').length;
    const critical = data.items.filter(b => b.recoveryStatus === 'CRITICAL').length;

    return {
      totalInWarehouse,
      totalRecovered,
      totalOutstanding,
      avgRecoveryRate,
      totalOrders,
      totalBrands: data.items.length,
      healthy,
      warning,
      critical,
    };
  }, [data]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Cargando métricas de marcas..." />;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  // Empty state
  if (!data || data.items.length === 0) {
    return (
      <EmptyState 
        message="No hay datos de marcas disponibles"
        suggestion="Intenta ajustar los filtros o el rango de fechas para ver resultados"
      />
    );
  }

  if (!totals) return null;

  return (
    <div className="space-y-6">
      {/* Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total en Bodega */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total en Bodega</span>
            <Package className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totals.totalInWarehouse)}</div>
          <div className="text-xs text-slate-500 mt-1">{totals.totalOrders} órdenes</div>
        </div>

        {/* Total Recuperado */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Recuperado</span>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-black text-green-600">{formatCurrency(totals.totalRecovered)}</div>
          <div className="text-xs text-slate-500 mt-1">{formatPercentage(totals.avgRecoveryRate)} de recuperación</div>
        </div>

        {/* Total Pendiente */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Pendiente</span>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600">{formatCurrency(totals.totalOutstanding)}</div>
          <div className="text-xs text-slate-500 mt-1">{totals.totalBrands} marcas</div>
        </div>

        {/* Estado de Marcas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Estado de Marcas</span>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600 font-semibold">● Saludable</span>
              <span className="font-bold">{totals.healthy}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-yellow-600 font-semibold">● Advertencia</span>
              <span className="font-bold">{totals.warning}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-600 font-semibold">● Crítico</span>
              <span className="font-bold">{totals.critical}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Recuperación (Donut Chart con SVG) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Distribución de Recuperación</h3>
        <div className="flex items-center justify-center gap-8">
          {/* Donut Chart SVG */}
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="30"
              />
              {/* Recovered segment */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#10b981"
                strokeWidth="30"
                strokeDasharray={`${(totals.avgRecoveryRate / 100) * 502.65} 502.65`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900">{formatPercentage(totals.avgRecoveryRate)}</div>
                <div className="text-xs text-slate-500 font-semibold">Recuperado</div>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <div>
                <div className="text-sm font-bold text-slate-900">Recuperado</div>
                <div className="text-xs text-slate-500">{formatCurrency(totals.totalRecovered)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-slate-300"></div>
              <div>
                <div className="text-sm font-bold text-slate-900">Pendiente</div>
                <div className="text-xs text-slate-500">{formatCurrency(totals.totalOutstanding)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Marcas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Detalle por Marca</h3>
          <p className="text-xs text-slate-500 mt-1">Top {data.items.length} marcas ordenadas por tasa de recuperación</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Marca</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">En Bodega</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Recuperado</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Pendiente</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">% Recuperación</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Órdenes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((brand) => (
                <tr key={brand.brandId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{brand.brandName}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-700">{formatCurrency(brand.totalInWarehouse)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">{formatCurrency(brand.totalRecovered)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600 font-semibold">{formatCurrency(brand.totalOutstanding)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">
                    <span className={
                      brand.recoveryRate > 50 ? 'text-green-600' :
                      brand.recoveryRate >= 30 ? 'text-yellow-600' :
                      'text-red-600'
                    }>
                      {formatPercentage(brand.recoveryRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                      brand.recoveryStatus === 'HEALTHY' ? 'bg-green-100 text-green-700' :
                      brand.recoveryStatus === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {brand.recoveryStatus === 'HEALTHY' ? 'Saludable' :
                       brand.recoveryStatus === 'WARNING' ? 'Advertencia' :
                       'Crítico'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-slate-700">{brand.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
