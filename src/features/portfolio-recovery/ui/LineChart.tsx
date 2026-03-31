/**
 * Gráfico de Línea Simplificado
 * Muestra el monto recuperado a lo largo del tiempo de forma clara y directa
 */

import { useMemo } from 'react';
import { formatCurrency } from '@/features/portfolio-recovery/types';
import type { RecoveryTrend } from '@/features/portfolio-recovery/types';
import { Activity } from 'lucide-react';

interface LineChartProps {
  data: RecoveryTrend[];
  title: string;
}

export function LineChart({ data, title }: LineChartProps) {
  // Calcular dimensiones y escalas
  const chartData = useMemo(() => {
    // Filtrar datos con period null
    const validData = data.filter(d => d.period !== null && d.period !== undefined);
    
    if (validData.length === 0) return null;

    const width = 1000;
    const height = 450;
    const padding = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxAmount = Math.max(...validData.map(d => d.totalRecovered));
    const minAmount = Math.min(...validData.map(d => d.totalRecovered));
    
    const range = maxAmount - minAmount || 1;
    const paddedMax = maxAmount + (range * 0.15);
    const paddedMin = Math.max(0, minAmount - (range * 0.05));

    const points = validData.map((d, i) => {
      const x = padding.left + (i / (validData.length - 1 || 1)) * chartWidth;
      const normalizedValue = (d.totalRecovered - paddedMin) / (paddedMax - paddedMin);
      const y = padding.top + chartHeight - (normalizedValue * chartHeight);
      
      return { x, y, data: d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `M ${points[0].x} ${padding.top + chartHeight} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${padding.top + chartHeight} Z`;

    const yAxisValues = [0, 1, 2, 3, 4].map(i => paddedMin + ((paddedMax - paddedMin) * i / 4));

    return { width, height, padding, chartWidth, chartHeight, maxAmount: paddedMax, minAmount: paddedMin, points, linePath, areaPath, validData, yAxisValues };
  }, [data]);

  if (!chartData || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px]">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">{title}</h3>
        <Activity className="w-12 h-12 mb-4 text-slate-200" />
        <p className="text-sm font-bold text-slate-400 italic">Tendencias en procesamiento...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-3xl p-10 h-full flex flex-col group">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
            <p className="text-2xl font-black text-slate-900 font-display">Histórico de Recaudación</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-monchito-purple shadow-sm shadow-monchito-purple/30"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto Recuperado</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex items-center justify-center">
        <svg 
          width={chartData.width} 
          height={chartData.height}
          className="mx-auto"
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines horizontales */}
          {chartData.yAxisValues.map((value, i) => {
            const y = chartData.padding.top + chartData.chartHeight - 
                     ((value - chartData.minAmount) / (chartData.maxAmount - chartData.minAmount)) * chartData.chartHeight;
            return (
              <g key={i}>
                <line
                  x1={chartData.padding.left}
                  y1={y}
                  x2={chartData.padding.left + chartData.chartWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartData.padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-slate-500 font-semibold"
                >
                  ${Math.round(value)}
                </text>
              </g>
            );
          })}

          {/* Área de relleno (gradiente verde suave) */}
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d={chartData.areaPath}
            fill="url(#areaGradient)"
          />

          {/* Línea principal (verde) */}
          <path
            d={chartData.linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos en la línea */}
          {chartData.points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="white"
                stroke="#10b981"
                strokeWidth="3"
                className="cursor-pointer hover:r-8 transition-all"
              >
                <title>{`${point.data.period}\nRecuperado: ${formatCurrency(point.data.totalRecovered)}\nÓrdenes: ${point.data.orderCount}`}</title>
              </circle>

              {/* Etiqueta de fecha */}
              {(i % Math.max(1, Math.ceil(chartData.validData.length / 8)) === 0 || i === chartData.validData.length - 1) && point.data.period && (
                <text
                  x={point.x}
                  y={chartData.height - 15}
                  textAnchor="middle"
                  className="text-xs fill-slate-600 font-semibold"
                >
                  {point.data.period?.split('-').slice(1).join('/') || ''}
                </text>
              )}

              {/* Valor sobre el punto (solo en algunos puntos para no saturar) */}
              {(i % Math.max(1, Math.ceil(chartData.validData.length / 6)) === 0 || i === chartData.validData.length - 1) && (
                <text
                  x={point.x}
                  y={point.y - 15}
                  textAnchor="middle"
                  className="text-xs fill-green-600 font-bold"
                >
                  ${Math.round(point.data.totalRecovered)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Estadísticas resumidas */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-200">
        <div>
          <div className="text-xs text-slate-500 font-semibold">Total Recuperado</div>
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(chartData.validData.reduce((sum, d) => sum + d.totalRecovered, 0))}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-semibold">Promedio por Período</div>
          <div className="text-lg font-bold text-slate-900">
            {formatCurrency(chartData.validData.reduce((sum, d) => sum + d.totalRecovered, 0) / chartData.validData.length)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-semibold">Mejor Período</div>
          <div className="text-lg font-bold text-blue-600">
            {formatCurrency(Math.max(...chartData.validData.map(d => d.totalRecovered)))}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-semibold">Total Órdenes</div>
          <div className="text-lg font-bold text-slate-900">
            {chartData.validData.reduce((sum, d) => sum + d.orderCount, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
