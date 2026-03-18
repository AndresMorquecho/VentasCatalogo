/**
 * Gráfico de Anillo (Donut Chart)
 * Muestra la distribución entre recuperado y pendiente
 */

import { formatCurrency, formatPercentage } from '@/features/portfolio-recovery/types';

interface DonutChartProps {
  recovered: number;
  outstanding: number;
  title: string;
}

export function DonutChart({ recovered, outstanding, title }: DonutChartProps) {
  const total = recovered + outstanding;
  const recoveredPercentage = total > 0 ? (recovered / total) * 100 : 0;
  const outstandingPercentage = total > 0 ? (outstanding / total) * 100 : 0;

  // Calcular el strokeDasharray para el círculo (radio reducido)
  const circumference = 2 * Math.PI * 60; // radio = 60 (antes 80)
  const recoveredDash = (recoveredPercentage / 100) * circumference;
  const outstandingDash = (outstandingPercentage / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-[240px] flex flex-col">
      <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{title}</h3>
      
      <div className="flex items-center justify-center gap-6 flex-1 min-h-0">
        {/* Donut Chart SVG - Más pequeño */}
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="20"
            />
            {/* Recovered segment (verde) */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="#10b981"
              strokeWidth="20"
              strokeDasharray={`${recoveredDash} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Outstanding segment (rojo) */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeDasharray={`${outstandingDash} ${circumference}`}
              strokeDashoffset={-recoveredDash}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">{formatPercentage(recoveredPercentage)}</div>
              <div className="text-xs text-slate-500 font-semibold">Recuperado</div>
            </div>
          </div>
        </div>

        {/* Leyenda - Más compacta */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <div className="text-xs font-bold text-slate-900">Recuperado</div>
              <div className="text-xs text-slate-500">{formatCurrency(recovered)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div>
              <div className="text-xs font-bold text-slate-900">Pendiente</div>
              <div className="text-xs text-slate-500">{formatCurrency(outstanding)}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <div className="text-xs text-slate-500 font-semibold">Total</div>
            <div className="text-sm font-bold text-slate-900">{formatCurrency(total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
