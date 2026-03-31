import { useMemo } from 'react';
import { cn } from '@/shared/lib/utils';

interface SpeedometerChartProps {
  recoveryRate: number;
  title: string;
}

export function SpeedometerChart({ recoveryRate, title }: SpeedometerChartProps) {
  // Determinar el nivel de riesgo
  const riskLevel = useMemo(() => {
    if (recoveryRate >= 70) return { level: 'Bajo', color: '#10b981', label: 'EXCELENTE', bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (recoveryRate >= 50) return { level: 'Moderado', color: '#f59e0b', label: 'BUENO', bgColor: 'bg-amber-50 text-amber-700 border-amber-100' };
    if (recoveryRate >= 30) return { level: 'Alto', color: '#f59e0b', label: 'ADVERTENCIA', bgColor: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { level: 'Crítico', color: '#ef4444', label: 'CRÍTICO', bgColor: 'bg-rose-50 text-rose-700 border-rose-100' };
  }, [recoveryRate]);

  // Calcular el ángulo de la aguja (de -90° a 90°)
  const needleAngle = useMemo(() => {
    return -90 + (recoveryRate / 100) * 180;
  }, [recoveryRate]);

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">{title}</h3>
      
      <div className="flex items-center justify-center gap-6 flex-1 min-h-0">
        {/* Columna Izquierda - Velocímetro */}
        <div className="flex flex-col items-center justify-center">
          {/* Velocímetro SVG */}
          <div className="relative">
            <svg width="140" height="90" viewBox="0 0 140 90">
              <defs>
                {/* Gradiente para el arco */}
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                
                {/* Sombra para la aguja */}
                <filter id="needleShadow">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3"/>
                </filter>
              </defs>

              {/* Arco de fondo gris claro */}
              <path
                d="M 20 75 A 50 50 0 0 1 120 75"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Arco principal con gradiente */}
              <path
                d="M 20 75 A 50 50 0 0 1 120 75"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Marcas de escala */}
              {[0, 30, 50, 70, 100].map((value) => {
                const angle = -90 + (value / 100) * 180;
                const radians = (angle * Math.PI) / 180;
                const x1 = 70 + Math.cos(radians) * 43;
                const y1 = 75 + Math.sin(radians) * 43;
                const x2 = 70 + Math.cos(radians) * 50;
                const y2 = 75 + Math.sin(radians) * 50;

                return (
                  <line
                    key={value}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Aguja con sombra */}
              <g transform={`rotate(${needleAngle} 70 75)`} filter="url(#needleShadow)">
                {/* Base de la aguja */}
                <circle
                  cx="70"
                  cy="75"
                  r="4"
                  fill="#334155"
                />
                {/* Aguja */}
                <path
                  d="M 70 75 L 68 75 L 66 30 L 70 25 L 74 30 L 72 75 Z"
                  fill="#334155"
                />
                {/* Punta de la aguja */}
                <circle
                  cx="70"
                  cy="25"
                  r="2"
                  fill={riskLevel.color}
                />
              </g>

              {/* Centro decorativo */}
              <circle
                cx="70"
                cy="75"
                r="2.5"
                fill="white"
              />
            </svg>
          </div>

          {/* Valor central */}
          <div className="text-center -mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {Math.round(recoveryRate)}
              <span className="text-lg text-slate-500 font-semibold ml-1">%</span>
            </div>
          </div>

          {/* Indicador de estado */}
          <div className="text-center mt-1">
            <div 
              className={cn("inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", riskLevel.bgColor)}
            >
              {riskLevel.label}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-semibold">
              Riesgo: <span className="font-bold text-slate-700">{riskLevel.level}</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Leyendas */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div>
              <div className="text-xs font-bold text-slate-900">Crítico</div>
              <div className="text-xs text-slate-500">0% - 30%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div>
              <div className="text-xs font-bold text-slate-900">Advertencia</div>
              <div className="text-xs text-slate-500">30% - 50%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div>
              <div className="text-xs font-bold text-slate-900">Bueno</div>
              <div className="text-xs text-slate-500">50% - 70%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <div className="text-xs font-bold text-slate-900">Excelente</div>
              <div className="text-xs text-slate-500">70% - 100%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
