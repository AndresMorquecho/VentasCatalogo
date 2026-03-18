/**
 * Gráfico de Línea Simplificado
 * Muestra el monto recuperado a lo largo del tiempo de forma clara y directa
 */

import { useMemo } from 'react';
import { formatCurrency } from '@/features/portfolio-recovery/types';
import type { RecoveryTrend } from '@/features/portfolio-recovery/types';

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

    const width = 800;
    const height = 400;
    const padding = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Encontrar valor máximo para escala
    const maxAmount = Math.max(...validData.map(d => d.totalRecovered));
    const minAmount = Math.min(...validData.map(d => d.totalRecovered));
    
    // Agregar 10% de padding arriba y abajo para mejor visualización
    const range = maxAmount - minAmount;
    const paddedMax = maxAmount + (range * 0.1);
    const paddedMin = Math.max(0, minAmount - (range * 0.1));

    // Crear puntos para la línea
    const points = validData.map((d, i) => {
      const x = padding.left + (i / (validData.length - 1)) * chartWidth;
      const normalizedValue = (d.totalRecovered - paddedMin) / (paddedMax - paddedMin);
      const y = padding.top + chartHeight - (normalizedValue * chartHeight);
      
      return {
        x,
        y,
        data: d,
      };
    });

    // Crear path para la línea
    const linePath = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    // Crear path para el área (relleno debajo de la línea)
    const areaPath = `
      M ${points[0].x} ${padding.top + chartHeight}
      L ${points.map(p => `${p.x} ${p.y}`).join(' L ')}
      L ${points[points.length - 1].x} ${padding.top + chartHeight}
      Z
    `;

    // Calcular valores para el eje Y (5 niveles)
    const yAxisValues = [];
    for (let i = 0; i <= 4; i++) {
      const value = paddedMin + ((paddedMax - paddedMin) * i / 4);
      yAxisValues.push(value);
    }

    return {
      width,
      height,
      padding,
      chartWidth,
      chartHeight,
      maxAmount: paddedMax,
      minAmount: paddedMin,
      points,
      linePath,
      areaPath,
      validData,
      yAxisValues,
    };
  }, [data]);

  if (!chartData || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 bg-slate-50 rounded-lg">
          <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-semibold">No hay datos suficientes para mostrar tendencias</p>
          <p className="text-xs mt-1">Las órdenes necesitan tener diferentes fechas de recepción</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs font-semibold text-slate-600">Monto Recuperado</span>
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
