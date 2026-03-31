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
import { KpiCard } from '@/features/dashboard/ui/KpiCard';
import { formatCurrency, formatPercentage } from '@/features/portfolio-recovery/types';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertCircle, 
  Target, 
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';
import type { RecoveryFilters } from '@/features/portfolio-recovery/types';
import { cn } from '@/shared/lib/utils';

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
    <div className="space-y-12">
      {/* --- Strategic Portfolio Metrics --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-monchito-purple" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">KPIs de Recuperación</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <KpiCard
                title="Capital en Riesgo"
                value={formatCurrency(totals.totalInWarehouse)}
                trend={-4.5}
                icon={<Package className="h-5 w-5" />}
                color="info"
                sparklineData={[65, 60, 62, 58, 55, 50, 48]}
                description="Total en Bodega"
            />
            <KpiCard
                title="Recuperado Total"
                value={formatCurrency(totals.totalRecovered)}
                trend={15.2}
                icon={<TrendingUp className="h-5 w-5" />}
                color="success"
                sparklineData={[40, 45, 52, 58, 65, 72, 80]}
                description={`${formatPercentage(totals.avgRecoveryRate)} de avance`}
            />
            <KpiCard
                title="Cartera Pendiente"
                value={formatCurrency(totals.totalOutstanding)}
                trend={-2.1}
                icon={<TrendingDown className="h-5 w-5" />}
                color="danger"
                sparklineData={[80, 85, 82, 78, 75, 70, 68]}
                description={`${totals.totalBrands} Marcas Activas`}
            />
            <KpiCard
                title="Estado Crítico"
                value={totals.critical}
                trend={totals.critical > 5 ? 10 : -5}
                icon={<AlertCircle className="h-5 w-5" />}
                color="warning"
                sparklineData={[2, 3, 5, 4, 6, 4, 3]}
                description="Marcas en Alerta"
            />
        </div>
      </div>

      {/* Gráficos Principales - Layout 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda - 3 Gráficos Apilados con Altura Fija Igual */}
        <div className="lg:col-span-4 space-y-6">
          {/* Gráfico de Anillo */}
          <div className="bg-white/80 backdrop-blur-md border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden p-6 hover:scale-[1.02] transition-all duration-300">
            <DonutChart
                recovered={totals.totalRecovered}
                outstanding={totals.totalOutstanding}
                title="Saturación de Cartera"
            />
          </div>

          {/* Gráfico de Velocímetro */}
          <div className="bg-white/80 backdrop-blur-md border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden p-6 hover:scale-[1.02] transition-all duration-300">
            <SpeedometerChart
                recoveryRate={totals.avgRecoveryRate}
                title="Nivel de Riesgo"
            />
          </div>

          {/* Resumen Ejecutivo */}
          <div className="bg-white/80 backdrop-blur-md border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-3xl p-8 flex flex-col group hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Resumen Ejecutivo</h3>
                <Zap className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Eficiencia</div>
                  <div className="text-2xl font-black text-monchito-purple font-display">{formatPercentage(totals.avgRecoveryRate)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Días Bodega</div>
                  <div className="text-2xl font-black text-slate-900 font-display">
                    {Math.round(data.items.reduce((sum, b: any) => sum + b.avgDaysInWarehouse, 0) / data.items.length)}d
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Segmentación por Riesgo</div>
                <div className="space-y-3">
                  {[
                    { label: 'Saludable', val: totals.healthy, color: 'bg-emerald-500' },
                    { label: 'Advertencia', val: totals.warning, color: 'bg-amber-500' },
                    { label: 'Crítico', val: totals.critical, color: 'bg-rose-500' }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between group/seg">
                        <span className="text-xs font-bold text-slate-600">{item.label}</span>
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={cn("h-full rounded-full transition-all duration-700", item.color)}
                                    style={{ width: `${(item.val / totals.totalBrands) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-black text-slate-900 min-w-[12px] text-right">{item.val}</span>
                        </div>
                    </div>
                  ))}
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

      {/* --- Advanced Tactical Detail --- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-monchito-purple" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Detalle Operacional por Marca</h2>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
               Total Marcas: {data.items.length}
            </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-monchito-purple/5 text-[10px] font-black uppercase tracking-widest text-monchito-purple/70 border-b border-monchito-purple/10">
                  <th className="px-8 py-6">Marca</th>
                  <th className="px-8 py-6 text-right">Inversión Bodega</th>
                  <th className="px-8 py-6 text-right">Monto Recuperado</th>
                  <th className="px-8 py-6 text-right">Cartera Pendiente</th>
                  <th className="px-8 py-6 text-right">Eficiencia</th>
                  <th className="px-8 py-6 text-center">Estado Crítico</th>
                  <th className="px-8 py-6 text-center">Volumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.items.map((brand) => (
                  <tr key={brand.brandId} className="hover:bg-monchito-purple/[0.02] transition-all duration-300 group cursor-pointer">
                    <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm group-hover:rotate-12 transition-transform">
                                <Target className="h-4 w-4 text-slate-400 group-hover:text-monchito-purple" />
                            </div>
                            <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-monchito-purple transition-colors">{brand.brandName}</span>
                        </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-400 text-right">{formatCurrency(brand.totalInWarehouse)}</td>
                    <td className="px-8 py-5 text-sm font-black text-emerald-600 text-right font-display">{formatCurrency(brand.totalRecovered)}</td>
                    <td className="px-8 py-5 text-sm font-black text-rose-600 text-right font-display">{formatCurrency(brand.totalOutstanding)}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                            "text-sm font-black font-display",
                            brand.recoveryRate > 70 ? 'text-emerald-600' :
                            brand.recoveryRate >= 40 ? 'text-amber-600' :
                            'text-rose-600'
                        )}>
                            {formatPercentage(brand.recoveryRate)}
                        </span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    brand.recoveryRate > 70 ? 'bg-emerald-500' :
                                    brand.recoveryRate >= 40 ? 'bg-amber-500' :
                                    'bg-rose-500'
                                )}
                                style={{ width: `${brand.recoveryRate}%` }}
                            />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          brand.recoveryStatus === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          brand.recoveryStatus === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                      )}>
                        {brand.recoveryStatus === 'HEALTHY' ? 'Estable' :
                         brand.recoveryStatus === 'WARNING' ? 'Atención' :
                         'Crítico'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-slate-500 text-center">{brand.orderCount} <span className="text-[10px] text-slate-300">ORD</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
