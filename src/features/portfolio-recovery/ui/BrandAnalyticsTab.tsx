/**
 * Portfolio Recovery Analysis - BrandAnalyticsTab Component
 * 
 * Dashboard con métricas generales y gráficos visuales de recuperación por marca.
 */

import { useState, useMemo } from 'react';
import { useBrandRecovery } from '../hooks/useBrandRecovery';
import { useRecoveryTrends } from '../hooks/useRecoveryTrends';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { EmptyState } from './EmptyState';
import { DonutChart } from './DonutChart';
import { LineChart } from './LineChart';
import { SpeedometerChart } from './SpeedometerChart';
import { formatCurrency, formatPercentage } from '@/features/portfolio-recovery/types';
import { TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import type { RecoveryFilters } from '@/features/portfolio-recovery/types';

interface BrandAnalyticsTabProps {
  filters: RecoveryFilters;
}

/**
 * Dashboard de análisis por marca
 */
export function BrandAnalyticsTab({ filters }: BrandAnalyticsTabProps) {
  const [page] = useState(1);
  const pageSize = 100;

  const { data, isLoading, error, refetch } = useBrandRecovery(
    filters,
    { page, pageSize }
  );

  const { data: trendsData, isLoading: trendsLoading } = useRecoveryTrends(
    filters,
    'WEEK'
  );

  // Calcular métricas totales
  const totals = useMemo(() => {
    if (!data || data.items.length === 0) return null;

    const totalInWarehouse = data.items.reduce((sum, b) => sum + b.totalInWarehouse, 0);
    const totalRecovered = data.items.reduce((sum, b) => sum + b.totalRecovered, 0);
    const totalOutstanding = data.items.reduce((sum, b) => sum + b.totalOutstanding, 0);
    const avgRecoveryRate = totalInWarehouse > 0 ? (totalRecovered / totalInWarehouse) * 100 : 0;
    const totalOrders = data.items.reduce((sum, b) => sum + b.orderCount, 0);

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
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total en Bodega</span>
            <Package className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totals.totalInWarehouse)}</div>
          <div className="text-xs text-slate-500 mt-1">{totals.totalOrders} órdenes</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Recuperado</span>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-black text-green-600">{formatCurrency(totals.totalRecovered)}</div>
          <div className="text-xs text-slate-500 mt-1">{formatPercentage(totals.avgRecoveryRate)} de recuperación</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Pendiente</span>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600">{formatCurrency(totals.totalOutstanding)}</div>
          <div className="text-xs text-slate-500 mt-1">{totals.totalBrands} marcas</div>
        </div>

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

      {/* Gráficos Principales - Layout 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda - 3 Gráficos Apilados con Altura Fija Igual */}
        <div className="lg:col-span-4 space-y-4">
          {/* Gráfico de Anillo */}
          <DonutChart
            recovered={totals.totalRecovered}
            outstanding={totals.totalOutstanding}
            title="Distribución de Recuperación"
          />

          {/* Gráfico de Velocímetro */}
          <SpeedometerChart
            recoveryRate={totals.avgRecoveryRate}
            title="Nivel de Riesgo"
          />

          {/* Resumen Ejecutivo */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-[240px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Resumen Ejecutivo</h3>
            <div className="space-y-2 flex-1">
              {/* Fila Superior - Tasa y Días en 2 columnas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-1">Tasa de Recuperación</div>
                  <div className="text-xl font-black text-monchito-purple">{formatPercentage(totals.avgRecoveryRate)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-1">Promedio Días en Bodega</div>
                  <div className="text-xl font-black text-slate-900">
                    {Math.round(data.items.reduce((sum, b) => sum + b.avgDaysInWarehouse, 0) / data.items.length)} días
                  </div>
                </div>
              </div>
              
              {/* Distribución por Estado */}
              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs text-slate-500 font-semibold mb-1.5">Distribución por Estado</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Saludable</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(totals.healthy / totals.totalBrands) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 w-5 text-right">{totals.healthy}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Advertencia</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${(totals.warning / totals.totalBrands) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 w-5 text-right">{totals.warning}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Crítico</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(totals.critical / totals.totalBrands) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 w-5 text-right">{totals.critical}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Gráfico de Línea (Más Grande) */}
        <div className="lg:col-span-8">
          {trendsLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
              <div className="flex items-center justify-center h-full min-h-[600px]">
                <LoadingSpinner message="Cargando tendencias..." />
              </div>
            </div>
          ) : (
            <LineChart
              data={trendsData || []}
              title="Trazabilidad de Recuperación en el Tiempo"
            />
          )}
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
