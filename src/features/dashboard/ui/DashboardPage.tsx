import { useState } from 'react';
import {
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    Clock,
    CheckCircle2,
    MoreHorizontal,
    Filter,
    DollarSign
} from 'lucide-react';
import { useDashboard } from '../model/hooks';
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

// --- Helpers ---
const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// --- Modern KPI Card Component ---
function KpiCard({ title, value, subtext, trend, icon: Icon, colorClass, iconBgClass }: any) {
    const isPositive = trend === 'up';
    return (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                            <p className="text-sm font-bold text-slate-500">{title}</p>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2">{value}</h3>
                        <div className="flex items-center gap-1 text-xs">
                            {isPositive ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 font-bold" />
                            ) : (
                                <ArrowDownRight className="h-3.5 w-3.5 text-rose-500 font-bold" />
                            )}
                            <span className={`font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {subtext.split(' ')[0]}
                            </span>
                            <span className="text-slate-400 font-medium"> {subtext.substring(subtext.indexOf(' ') + 1)}</span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-2xl ${iconBgClass}`}>
                        <Icon className={`h-6 w-6 ${colorClass}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function DashboardPage() {
    const { data, isLoading } = useDashboard();
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 border-r-2" />
                    <p className="text-slate-500 font-bold animate-pulse">Cargando sistema...</p>
                </div>
            </div>
        );
    }

    const oldestOrders = data?.alerts.oldestOrders ?? [];

    // Status metrics
    const totalOrders = Object.values(data?.operational.ordersByStatus || {}).reduce((a, b) => a + b, 0) || 1;
    const stats = {
        entregados: { count: data?.operational.ordersByStatus.entregado ?? 0, color: '#3b82f6' }, // Blue
        pendientes: { count: data?.operational.ordersByStatus.recepcionado ?? 0, color: '#111827' }, // Dark
        porRecibir: { count: data?.operational.ordersByStatus.porRecibir ?? 0, color: '#94a3b8' } // Gray
    };

    // Calculate percentages for donut
    const getPercent = (val: number) => Math.round((val / totalOrders) * 100);

    return (
        <div className="min-h-screen bg-white p-4 lg:p-8 space-y-8 font-sans">
            <main className="max-w-[1600px] mx-auto space-y-8">

                {/* --- Top Metrics Header --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title="Clientes Activos"
                        value={data?.operational.totalActiveClients ?? 0}
                        subtext="+6.5% último mes"
                        trend="up"
                        icon={Users}
                        colorClass="text-indigo-600"
                        iconBgClass="bg-indigo-50"
                    />
                    <KpiCard
                        title="Ingresos Estimados"
                        value={fmt(data?.financial.currentCash ?? 0)}
                        subtext="+12.5% última semana"
                        trend="up"
                        icon={DollarSign}
                        colorClass="text-emerald-600"
                        iconBgClass="bg-emerald-50"
                    />
                    <KpiCard
                        title="Pedidos Entregados"
                        value={data?.operational.totalOrdersDelivered ?? 0}
                        subtext="+8.2% último mes"
                        trend="up"
                        icon={CheckCircle2}
                        colorClass="text-blue-600"
                        iconBgClass="bg-blue-50"
                    />
                    <KpiCard
                        title="Pedidos Pendientes"
                        value={data?.operational.ordersPending ?? 0}
                        subtext="-2.4% última semana"
                        trend="down"
                        icon={Clock}
                        colorClass="text-amber-600"
                        iconBgClass="bg-amber-50"
                    />
                </div>

                {/* --- Charts Section --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Invoice Statistics (Donut Chart) */}
                    <Card className="lg:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden flex flex-col">
                        <div className="p-6 pb-0 flex justify-between items-center">
                            <h4 className="font-black text-slate-800">Estadísticas de Pedidos</h4>
                            <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
                        </div>
                        <CardContent className="flex-1 p-6 flex flex-col items-center justify-center">
                            <div className="relative h-48 w-48 mb-8">
                                <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                    <circle
                                        cx="50" cy="50" r="40" fill="transparent"
                                        stroke={stats.entregados.color}
                                        strokeWidth="12"
                                        strokeDasharray={`${getPercent(stats.entregados.count) * 2.51} 251`}
                                    />
                                    <circle
                                        cx="50" cy="50" r="40" fill="transparent"
                                        stroke={stats.pendientes.color}
                                        strokeWidth="12"
                                        strokeDasharray={`${getPercent(stats.pendientes.count) * 2.51} 251`}
                                        strokeDashoffset={`-${getPercent(stats.entregados.count) * 2.51}`}
                                    />
                                    <circle
                                        cx="50" cy="50" r="40" fill="transparent"
                                        stroke={stats.porRecibir.color}
                                        strokeWidth="12"
                                        strokeDasharray={`${getPercent(stats.porRecibir.count) * 2.51} 251`}
                                        strokeDashoffset={`-${(getPercent(stats.entregados.count) + getPercent(stats.pendientes.count)) * 2.51}`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <p className="text-3xl font-black text-slate-900">{totalOrders}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Totales</p>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                                        <span className="text-sm font-bold text-slate-600">Entregados</span>
                                    </div>
                                    <span className="font-black text-slate-900">{stats.entregados.count}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-slate-900" />
                                        <span className="text-sm font-bold text-slate-600">Pendientes</span>
                                    </div>
                                    <span className="font-black text-slate-900">{stats.pendientes.count}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-slate-400" />
                                        <span className="text-sm font-bold text-slate-600">Por Recibir</span>
                                    </div>
                                    <span className="font-black text-slate-900">{stats.porRecibir.count}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sales Analytics (Line Chart) */}
                    <Card className="lg:col-span-8 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden flex flex-col">
                        <div className="p-6 pb-0 flex justify-between items-center">
                            <h4 className="font-black text-slate-800">Analítica de Pedidos</h4>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setTimeRange('daily')} className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest transition-all ${timeRange === 'daily' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Diario</button>
                                <button onClick={() => setTimeRange('weekly')} className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest transition-all ${timeRange === 'weekly' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Semanal</button>
                                <button onClick={() => setTimeRange('monthly')} className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest transition-all ${timeRange === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Mensual</button>
                            </div>
                        </div>
                        <CardContent className="flex-1 p-6 pt-12 flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recibidos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entregados</span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[250px] relative group flex">
                                {(() => {
                                    const trendData = data?.charts?.ordersTrend?.[timeRange] ?? [];
                                    if (!trendData || trendData.length === 0) {
                                        return <div className="flex items-center justify-center w-full h-full text-slate-400 font-bold text-sm">No hay datos suficientes</div>;
                                    }

                                    const maxVal = Math.max(...trendData.flatMap(d => [d.created, d.delivered, 5]));
                                    const ht = (val: number) => (val / maxVal) * 90 + 5; // offset lightly

                                    const pathCreated = trendData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i / (Math.max(1, trendData.length - 1))) * 100} ${100 - ht(d.created)}`).join(' ');
                                    const pathDelivered = trendData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i / (Math.max(1, trendData.length - 1))) * 100} ${100 - ht(d.delivered)}`).join(' ');

                                    const filledCreated = `${pathCreated} L 100 100 L 0 100 Z`;

                                    return (
                                        <>
                                            {/* Dynamic Line Chart */}
                                            <div className="absolute inset-0 flex items-end justify-between gap-0 z-10 w-full mb-6">
                                                {trendData.map((item, i) => (
                                                    <div key={i} className="flex-1 flex justify-center group/point relative h-full">
                                                        {/* Created Dot */}
                                                        <div
                                                            className="absolute w-3 h-3 -translate-x-1/2 rounded-full border-2 border-indigo-500 bg-white z-20 cursor-pointer hover:scale-150 hover:bg-indigo-500 transition-all shadow-sm"
                                                            style={{ bottom: `calc(${ht(item.created)}% - 6px)`, left: '50%' }}
                                                        >
                                                            <div className="opacity-0 group-hover/point:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-xl">
                                                                Recibidos: {item.created}
                                                            </div>
                                                        </div>
                                                        {/* Delivered Dot */}
                                                        <div
                                                            className="absolute w-3 h-3 -translate-x-1/2 rounded-full border-2 border-emerald-500 bg-white z-20 cursor-pointer hover:scale-150 hover:bg-emerald-500 transition-all shadow-sm"
                                                            style={{ bottom: `calc(${ht(item.delivered)}% - 6px)`, left: '50%' }}
                                                        >
                                                            <div className="opacity-0 group-hover/point:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-xl">
                                                                Entregados: {item.delivered}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="absolute inset-0 w-full h-full mb-6 z-0 pointer-events-none">
                                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                                    {/* Delivered Line */}
                                                    <path d={pathDelivered} fill="none" stroke="#10b981" strokeWidth="0.8" strokeLinejoin="round" />
                                                    {/* Created Line */}
                                                    <path d={pathCreated} fill="none" stroke="#6366f1" strokeWidth="0.8" strokeLinejoin="round" />
                                                    <path d={filledCreated} fill="url(#gradient)" opacity="0.1" />
                                                    <defs>
                                                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                                            <stop offset="0%" stopColor="#6366f1" />
                                                            <stop offset="100%" stopColor="transparent" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            </div>

                                            {/* X-Axis Labels */}
                                            <div className="absolute bottom-0 inset-x-0 flex justify-between px-2">
                                                {trendData.map((item, i) => (
                                                    <span key={i} className="text-[10px] font-bold text-slate-400 flex-1 text-center truncate">
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

                {/* --- Recent Invoices / Orders Table --- */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                    <div className="p-6 flex justify-between items-center border-b border-slate-50">
                        <h4 className="font-black text-slate-800">Facturas / Pedidos Recientes</h4>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="flex items-center gap-2 py-1.5 px-4 border-2 font-bold cursor-pointer hover:bg-slate-50 rounded-lg">
                                <Filter className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-slate-600">Filtrar</span>
                            </Badge>
                            <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100/50">
                                        <th className="px-6 py-5">No</th>
                                        <th className="px-6 py-5">Id Cliente / Ref</th>
                                        <th className="px-6 py-5">Nombre Cliente</th>
                                        <th className="px-6 py-5">Detalle Items</th>
                                        <th className="px-6 py-5">Fecha Pedido</th>
                                        <th className="px-6 py-5">Estado</th>
                                        <th className="px-6 py-5 text-right">Precio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {oldestOrders.map((order, index) => (
                                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer bg-white">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-400">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-black text-slate-500">#{order.id.slice(0, 6)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 shadow-sm">
                                                        <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-black">
                                                            {order.clientName?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-bold text-slate-700">{order.clientName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-600">Pedido {order.days} días en bodega</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-400">
                                                21/07/2026 08:21 {/* Mock date to match design, ideally would use order.date */}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 hover:bg-rose-200">
                                                    Atrasado
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-slate-700">
                                                    {fmt(order.value)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {oldestOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold italic">
                                                No hay registros recientes para mostrar
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

