import { useState } from 'react';
import {
    Package,
    Clock,
    CheckCircle2,
    DollarSign,
    Sparkles,
    ShieldAlert,
    BarChart3,
    Zap,
    TrendingUp,
    Activity,
    SlidersHorizontal,
    X,
    CalendarRange
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDashboard } from '../model/hooks';
import { useBrandsList } from '@/features/portfolio-recovery/hooks/useBrandsList';
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { KpiCard } from './KpiCard';
import { cn } from "@/shared/lib/utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import type { OrdersTrendData } from '../model/types';

// --- Helpers ---
const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

export function DashboardPage() {
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const isMobile = useIsMobile();

    // ── Filters state ──────────────────────────────────────────
    const [brandId, setBrandId] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [showCalendar, setShowCalendar] = useState(false);

    const { data: brandsList } = useBrandsList();
    const { data, isLoading, isError } = useDashboard({
        brandId: brandId || undefined,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
    });

    const hasActiveFilters = !!brandId || !!dateRange.from;
    const clearFilters = () => { setBrandId(''); setDateRange({}); setShowCalendar(false); };
    const dateLabel = dateRange.from
        ? dateRange.to
            ? `${format(dateRange.from, 'dd/MM/yy')} – ${format(dateRange.to, 'dd/MM/yy')}`
            : `Desde ${format(dateRange.from, 'dd/MM/yy')}`
        : 'Rango de Fechas';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fcfaff] flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 animate-ping rounded-full bg-monchito-purple/20" />
                        <div className="relative animate-spin rounded-full h-16 w-16 border-[3px] border-monchito-purple border-t-transparent shadow-xl shadow-monchito-purple/20" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando Métricas...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="h-20 w-20 flex items-center justify-center bg-rose-50 rounded-3xl mb-4">
                        <ShieldAlert className="h-10 w-10 text-rose-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 font-display">Error de Comunicación</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-xs">No pudimos conectar con el servidor de analítica.<br />Intenta refrescar la sesión.</p>
                </div>
            </div>
        );
    }

    const oldestOrders = data?.alerts.oldestOrders ?? [];
    const totalOrders = Object.values(data?.operational.ordersByStatus || {}).reduce((a: number, b: number) => a + b, 0);

    const stats = {
        entregados: { count: data?.operational.ordersByStatus.entregado ?? 0, color: '#3b82f6' },
        pendientes: { count: data?.operational.ordersByStatus.recepcionado ?? 0, color: '#111827' },
        porRecibir: { count: data?.operational.ordersByStatus.porRecibir ?? 0, color: '#94a3b8' }
    };

    const getPercent = (val: number) => totalOrders > 0 ? Math.round((val / totalOrders) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#fcfaff] p-4 lg:p-12 space-y-8 font-sans selection:bg-monchito-purple selection:text-white">
            <main className="max-w-[1700px] mx-auto space-y-8">

                {/* --- Executive Header --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-monchito-purple font-black uppercase tracking-[0.3em] text-[10px]">
                            <Sparkles className="h-3 w-3" />
                            Dashboard Corporativo
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 font-display tracking-tight leading-none">Centro Operativo</h1>
                        <p className="text-sm font-medium text-slate-400">Panel de control con analítica estratégica y métricas en tiempo real.</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Período del Gráfico</div>
                        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                            {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={cn(
                                        "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500",
                                        timeRange === range ? "bg-monchito-purple text-white shadow-xl shadow-monchito-purple/20 ring-4 ring-monchito-purple/5" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                    )}
                                >
                                    {range === 'daily' ? 'Diario' : range === 'weekly' ? 'Semanal' : 'Mensual'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- Filter Bar --- */}
                <div className="flex flex-wrap items-center gap-3 bg-white/70 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/60 shadow-sm relative z-50">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filtros
                    </div>

                    {/* Brand selector */}
                    <select
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 px-3 outline-none focus:ring-2 focus:ring-monchito-purple/20 bg-white appearance-none min-w-[160px] max-w-[200px]"
                    >
                        <option value="">Todas las marcas</option>
                        {brandsList?.map((b: { id: string; name: string }) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    {/* Date range picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCalendar(prev => !prev)}
                            className={cn(
                                "h-9 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all",
                                dateRange.from
                                    ? "border-monchito-purple/40 bg-monchito-purple/5 text-monchito-purple"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-monchito-purple/30"
                            )}
                        >
                            <CalendarRange className="h-3.5 w-3.5" />
                            {dateLabel}
                        </button>
                        {showCalendar && (
                            <div className="absolute top-11 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden" style={{ minWidth: isMobile ? '320px' : '640px' }}>
                                <style>{`
                                    .rdp-dashboard {
                                        --rdp-accent-color: #7c3aed;
                                        --rdp-accent-background-color: #ede9fe;
                                        --rdp-day-height: 36px;
                                        --rdp-day-width: 36px;
                                        --rdp-day_button-border-radius: 8px;
                                        --rdp-day_button-height: 34px;
                                        --rdp-day_button-width: 34px;
                                        --rdp-range_middle-background-color: #ede9fe;
                                        --rdp-range_start-color: white;
                                        --rdp-range_end-color: white;
                                        --rdp-range_start-date-background-color: #7c3aed;
                                        --rdp-range_end-date-background-color: #7c3aed;
                                        --rdp-today-color: #7c3aed;
                                        font-family: inherit;
                                        padding: 16px;
                                        display: flex;
                                        flex-direction: column;
                                        gap: 16px;
                                    }
                                    .rdp-dashboard .rdp-months { display: flex; gap: 32px; flex-wrap: wrap; }
                                    .rdp-dashboard .rdp-month { display: flex; flex-direction: column; gap: 12px; }
                                    .rdp-dashboard .rdp-month_caption { display: flex; justify-content: center; align-items: center; height: 32px; margin-bottom: 8px; position: relative; }
                                    .rdp-dashboard .rdp-caption_label { font-size: 14px; font-weight: 800; color: #1e1b4b; text-transform: capitalize; }
                                    .rdp-dashboard .rdp-nav { position: absolute; right: 0; display: flex; gap: 4px; }
                                    .rdp-dashboard .rdp-nav button { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; color: #64748b; transition: all 0.15s; }
                                    .rdp-dashboard .rdp-nav button:hover { background: #f5f3ff; border-color: #a78bfa; color: #7c3aed; }
                                    .rdp-dashboard .rdp-table { border-collapse: collapse; width: 100%; }
                                    .rdp-dashboard .rdp-head_row { display: flex; margin-bottom: 8px; }
                                    .rdp-dashboard .rdp-head_cell { flex: 1; text-align: center; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
                                    .rdp-dashboard .rdp-tbody { display: flex; flex-direction: column; gap: 2px; }
                                    .rdp-dashboard .rdp-row { display: flex; gap: 2px; }
                                    .rdp-dashboard .rdp-cell { flex: 1; display: flex; justify-content: center; }
                                    .rdp-dashboard .rdp-day_button { 
                                        width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; 
                                        border: none; background: transparent; cursor: pointer; border-radius: 8px;
                                        font-size: 12px; font-weight: 600; color: #334155; transition: all 0.15s;
                                    }
                                    .rdp-dashboard .rdp-day_button:hover:not([disabled]):not(.rdp-day_selected) { background: #f5f3ff; color: #7c3aed; }
                                    .rdp-dashboard .rdp-selected .rdp-day_button { background: #7c3aed; color: white; }
                                    .rdp-dashboard .rdp-range_middle .rdp-day_button { background: #ede9fe; color: #6d28d9; border-radius: 0; width: 100%; }
                                    .rdp-dashboard .rdp-range_start .rdp-day_button { border-radius: 8px 0 0 8px; }
                                    .rdp-dashboard .rdp-range_end .rdp-day_button { border-radius: 0 8px 8px 0; }
                                    .rdp-dashboard .rdp-today .rdp-day_button { color: #7c3aed; font-weight: 800; text-decoration: underline; }
                                    .rdp-dashboard .rdp-outside .rdp-day_button { color: #cbd5e1; opacity: 0.5; }
                                `}</style>
                                <DayPicker
                                    mode="range"
                                    selected={{ from: dateRange.from, to: dateRange.to }}
                                    onSelect={(range) => {
                                        setDateRange({ from: range?.from, to: range?.to });
                                        if (range?.from && range?.to) setShowCalendar(false);
                                    }}
                                    locale={es}
                                    numberOfMonths={isMobile ? 1 : 2}
                                    className="rdp-dashboard"
                                />
                                <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                                    <button
                                        onClick={() => { setDateRange({}); setShowCalendar(false); }}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all"
                                    >
                                        Limpiar
                                    </button>
                                    <button
                                        onClick={() => setShowCalendar(false)}
                                        className="text-xs font-bold text-white px-4 py-2 rounded-xl bg-monchito-purple hover:bg-monchito-purple/90 transition-all shadow-sm"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active filters indicator + clear */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all ml-auto"
                        >
                            <X className="h-3 w-3" />
                            Limpiar filtros
                        </button>
                    )}

                    {isLoading && (
                        <div className="ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-monchito-purple/60 animate-pulse">
                            <div className="h-2 w-2 rounded-full bg-monchito-purple/40 animate-ping" />
                            Actualizando...
                        </div>
                    )}
                </div>

                {/* --- Strategic KPI Grid --- */}
                <div className="space-y-6">
                     <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-monchito-purple" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">KPIs de Alto Impacto</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        <KpiCard
                            title="Billetera Total"
                            value={fmt(data?.financial.currentCash ?? 0)}
                            trend={12.5}
                            icon={<DollarSign className="h-5 w-5" />}
                            color="success"
                            sparklineData={[40, 48, 45, 55, 60, 58, 65]}
                            description="Liquidez Inmediata"
                        />
                        <KpiCard
                            title="Pedidos Finalizados"
                            value={data?.operational.totalOrdersDelivered ?? 0}
                            trend={8.2}
                            icon={<CheckCircle2 className="h-5 w-5" />}
                            color="info"
                            sparklineData={[120, 135, 142, 138, 150, 155, 162]}
                            description="Entrega Exitosa"
                        />
                        <KpiCard
                            title="Cartera Pendiente"
                            value={fmt(data?.financial.totalPortfolioPending ?? 0)}
                            trend={-2.4}
                            icon={<ShieldAlert className="h-5 w-5" />}
                            color="danger"
                            sparklineData={[80, 75, 72, 68, 65, 70, 68]}
                            description="Riesgo de Cobro"
                        />
                        <KpiCard
                            title="Retención Máxima"
                            value={`${oldestOrders[0]?.days ?? 0}d`}
                            trend={-5.1}
                            icon={<Clock className="h-5 w-5" />}
                            color="warning"
                            sparklineData={[15, 12, 13, 10, 8, 7, 5]}
                            description="Logística Inversa"
                        />
                    </div>
                </div>

                {/* --- Operational Intelligence Section --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Status Distribution Visual */}
                    <Card className="lg:col-span-4 border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-md overflow-hidden flex flex-col h-full group">
                        <div className="p-8 pb-0 flex justify-between items-center">
                            <h4 className="font-black text-slate-800 font-display tracking-tight text-lg group-hover:text-monchito-purple transition-colors">Estado Logístico</h4>
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-blue-500" />
                            </div>
                        </div>
                        <CardContent className="flex-1 p-8 flex flex-col items-center justify-center">
                            <div className="relative h-64 w-64 mb-10 group/donut transition-transform duration-500 hover:scale-105">
                                <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
                                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="#f8fafc" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="transparent"
                                        stroke="#3b82f6"
                                        strokeWidth="8"
                                        strokeDasharray={`${getPercent(stats.entregados.count) * 2.63} 263`}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                    <circle
                                        cx="50" cy="50" r="42" fill="transparent"
                                        stroke="#1e293b"
                                        strokeWidth="8"
                                        strokeDasharray={`${getPercent(stats.pendientes.count) * 2.63} 263`}
                                        strokeDashoffset={`-${getPercent(stats.entregados.count) * 2.63}`}
                                        className="transition-all duration-1000 ease-out delay-100"
                                    />
                                    <circle
                                        cx="50" cy="50" r="42" fill="transparent"
                                        stroke="#94a3b8"
                                        strokeWidth="8"
                                        strokeDasharray={`${getPercent(stats.porRecibir.count) * 2.63} 263`}
                                        strokeDashoffset={`-${(getPercent(stats.entregados.count) + getPercent(stats.pendientes.count)) * 2.63}`}
                                        className="transition-all duration-1000 ease-out delay-200"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <p className="text-4xl font-black text-slate-900 font-display tracking-tight">{totalOrders}</p>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Total Pedidos</p>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                {Object.entries(stats).map(([key, item]) => (
                                    <div key={key} className="flex justify-between items-center p-3 rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100 group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full group-hover/item:scale-125 transition-transform" style={{ backgroundColor: item.color }} />
                                            <span className="text-sm font-bold text-slate-600 capitalize">{key}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black text-slate-400 group-hover/item:bg-monchito-purple/10 group-hover/item:text-monchito-purple transition-colors">
                                                {getPercent(item.count)}%
                                            </span>
                                            <span className="font-black text-slate-900 group-hover/item:translate-x-[-4px] transition-transform">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Operational Trend Analysis */}
                    <Card className="lg:col-span-8 border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-md overflow-hidden flex flex-col h-full">
                        <div className="p-8 pb-0">
                             <div className="flex items-center gap-2 text-monchito-purple font-black uppercase tracking-[0.2em] text-[10px] mb-2">
                                <TrendingUp className="h-3 w-3" />
                                Tendencia Operacional
                            </div>
                            <h4 className="font-black text-slate-800 font-display tracking-tight text-lg">Pedidos vs Entregas</h4>
                        </div>
                        <CardContent className="flex-1 p-8 pt-12 flex flex-col">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="flex items-center gap-2 group cursor-help">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/30 group-hover:scale-125 transition-transform" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recibidos</span>
                                </div>
                                <div className="flex items-center gap-2 group cursor-help">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 group-hover:scale-125 transition-transform" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entregados</span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[350px] relative group flex">
                                {(() => {
                                    const rawData = data?.charts?.ordersTrend?.[timeRange] as OrdersTrendData[] | undefined;
                                    const trendData = rawData ?? [];
                                    if (!trendData || trendData.length === 0) {
                                        return <div className="flex items-center justify-center w-full h-full text-slate-400 font-bold text-sm italic">Sin datos disponibles para el periodo</div>;
                                    }

                                    const maxVal = Math.max(...trendData.flatMap(d => [d.created, d.delivered, 5]));
                                    const ht = (val: number) => (val / maxVal) * 85 + 5;

                                    const pathCreatedArr = trendData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i / (Math.max(1, trendData.length - 1))) * 100} ${100 - ht(d.created)}`);
                                    const pathCreated = pathCreatedArr.join(' ');
                                    const pathDeliveredArr = trendData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i / (Math.max(1, trendData.length - 1))) * 100} ${100 - ht(d.delivered)}`);
                                    const pathDelivered = pathDeliveredArr.join(' ');

                                    const filledCreated = `${pathCreated} L 100 100 L 0 100 Z`;

                                    return (
                                        <>
                                            <div className="absolute inset-0 flex items-end justify-between gap-0 z-10 w-full mb-10 overflow-visible">
                                                {trendData.map((item, i) => (
                                                    <div key={i} className="flex-1 flex justify-center group/point relative h-full">
                                                        <div className="absolute top-0 bottom-0 w-px bg-slate-100 opacity-0 group-hover/point:opacity-100 transition-opacity" />
                                                        <div
                                                            className="absolute w-4 h-4 -translate-x-1/2 rounded-full border-[3px] border-indigo-500 bg-white z-20 cursor-pointer transition-all duration-300 shadow-lg group-hover/point:scale-150 group-hover/point:bg-indigo-500"
                                                            style={{ bottom: `calc(${ht(item.created)}% - 8px)`, left: '50%' }}
                                                        >
                                                            <div className="opacity-0 group-hover/point:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] px-3 py-2 rounded-xl font-black whitespace-nowrap shadow-2xl transition-all scale-75 group-hover/point:scale-100 flex items-center gap-2">
                                                                <Package className="h-3 w-3 text-indigo-400" /> Recibidos: {item.created}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="absolute w-4 h-4 -translate-x-1/2 rounded-full border-[3px] border-emerald-500 bg-white z-20 cursor-pointer transition-all duration-300 shadow-lg group-hover/point:scale-150 group-hover/point:bg-emerald-500"
                                                            style={{ bottom: `calc(${ht(item.delivered)}% - 8px)`, left: '50%' }}
                                                        >
                                                            <div className="opacity-0 group-hover/point:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] px-3 py-2 rounded-xl font-black whitespace-nowrap shadow-2xl transition-all scale-75 group-hover/point:scale-100 translate-y-[-24px] flex items-center gap-2">
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Entregas: {item.delivered}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="absolute inset-0 w-full h-full mb-10 z-0 pointer-events-none">
                                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                                    <path d={pathDelivered} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                                                    <path d={pathCreated} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                                                    <path d={filledCreated} fill="url(#gradientMain)" opacity="0.15" />
                                                    <defs>
                                                        <linearGradient id="gradientMain" x1="0" x2="0" y1="0" y2="1">
                                                            <stop offset="0%" stopColor="#6366f1" />
                                                            <stop offset="90%" stopColor="transparent" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            </div>

                                            <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 pt-4 border-t border-slate-100">
                                                {trendData.map((item, i) => (
                                                    <span key={i} className="text-[10px] font-black text-slate-400 flex-1 text-center truncate uppercase tracking-tighter hover:text-slate-900 transition-colors cursor-default">
                                                        {item.period}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Advanced Tactical List --- */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-monchito-purple" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Detección de Anomalías</h2>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black bg-monchito-purple/5 text-monchito-purple border-monchito-purple/20 px-3 py-1">
                           Monitoreo: Bodega Principal
                        </Badge>
                    </div>
                    
                    <Card className="border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-md overflow-hidden">
                        <CardContent className="p-0">
                            {isMobile ? (
                                <div className="divide-y divide-slate-100">
                                    {oldestOrders.map((order: any) => (
                                        <div key={order.id} className="p-4 space-y-4 bg-white/40">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 shadow-lg shadow-monchito-purple/10">
                                                        <AvatarFallback className="bg-monchito-purple/5 text-monchito-purple text-xs font-black">
                                                            {order.clientName?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-800 tracking-tight">{order.clientName}</span>
                                                        <span className="text-[10px] font-mono text-slate-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                                <Badge className={cn(
                                                    "border-none font-black text-[9px] uppercase tracking-widest px-3 py-1",
                                                    order.days > 15 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                                                )}>
                                                    {order.days > 15 ? 'Crítico' : 'Atrasado'}
                                                </Badge>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Custodia</span>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-monchito-purple" />
                                                        <span className="text-xs font-bold text-slate-600">{order.days} días</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Valor</span>
                                                    <span className="text-sm font-black text-slate-900">{fmt(order.value)}</span>
                                                </div>
                                            </div>

                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        order.days > 15 ? "bg-rose-500" : order.days > 7 ? "bg-amber-500" : "bg-emerald-500"
                                                    )}
                                                    style={{ width: `${Math.min(100, (order.days / 30) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {oldestOrders.length === 0 && (
                                        <div className="p-12 text-center opacity-40">
                                            <Zap className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Bodega Optimizada</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="text-left border-collapse min-w-[1000px] w-full">
                                        <thead>
                                            <tr className="bg-monchito-purple/5 text-[10px] font-black uppercase tracking-widest text-monchito-purple/70 border-b border-monchito-purple/10 backdrop-blur-sm sticky top-0 z-10">
                                                <th className="px-8 py-6">Operación</th>
                                                <th className="px-8 py-6">ID Localizador</th>
                                                <th className="px-8 py-6">Empresaria / Cliente</th>
                                                <th className="px-8 py-6">Análisis de Retención</th>
                                                <th className="px-8 py-6">Fecha de Recepción</th>
                                                <th className="px-8 py-6 text-center">Severidad</th>
                                                <th className="px-8 py-6 text-right">Valor Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {oldestOrders.map((order: any, index: number) => (
                                                <tr key={order.id} className="hover:bg-monchito-purple/[0.02] transition-all duration-300 group cursor-pointer bg-white/40">
                                                    <td className="px-8 py-5 text-xs font-black text-slate-300">{index + 1}</td>
                                                    <td className="px-8 py-5 text-sm font-black text-slate-500 font-mono">
                                                        <span className="text-monchito-purple/40">#</span>{order.id.slice(0, 8).toUpperCase()}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-10 w-10 shadow-lg shadow-monchito-purple/10 border-2 border-white ring-1 ring-slate-100 group-hover:ring-monchito-purple/30 transition-all">
                                                                <AvatarFallback className="bg-monchito-purple/5 text-monchito-purple text-[10px] font-black uppercase tracking-tighter">
                                                                    {order.clientName?.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">{order.clientName}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner Monchito</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <Package className="h-4 w-4 text-slate-300 group-hover:text-monchito-purple transition-colors" />
                                                                <span className="text-sm font-bold text-slate-600 tracking-tight">{order.days} días en custodia</span>
                                                            </div>
                                                            <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all duration-1000",
                                                                        order.days > 15 ? "bg-rose-500" : order.days > 7 ? "bg-amber-500" : "bg-emerald-500"
                                                                    )}
                                                                    style={{ width: `${Math.min(100, (order.days / 30) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-400">
                                                        {new Intl.DateTimeFormat('es-CO', { 
                                                            day: '2-digit', 
                                                            month: 'short', 
                                                            year: 'numeric' 
                                                        }).format(new Date())}
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <Badge className={cn(
                                                            "border-none font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 hover:scale-105 transition-transform",
                                                            order.days > 15 ? "bg-rose-100 text-rose-600 shadow-sm shadow-rose-100/50" : "bg-amber-100 text-amber-600 shadow-sm shadow-amber-100/50"
                                                        )}>
                                                            {order.days > 15 ? 'Crítico' : 'Atrasado'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-sm font-black text-slate-900 group-hover:text-monchito-purple transition-colors font-display">
                                                            {fmt(order.value)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {oldestOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                                            <Zap className="h-12 w-12 text-slate-300" />
                                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Bodega Optimizada: Cero Atrasados</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
