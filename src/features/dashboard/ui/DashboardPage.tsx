
import { useNavigate } from 'react-router-dom';
import {
    Users,
    ArrowUpRight,
    Package,
    Clock,
    CheckCircle2,
    ChevronDown,
    MoreVertical,
    AlertCircle
} from 'lucide-react';
import { useDashboard } from '../model/hooks';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// ─── Componentes de UI NevBank Style ─────────────────────────────────────────


function SmallCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-50 flex justify-between items-start group hover:shadow-md transition-all cursor-pointer">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500">{label}</span>
                </div>
                <div className="text-2xl font-black text-[#1a1c1e] tracking-tight">{value}</div>
            </div>
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                <Icon size={24} />
            </div>
        </div>
    );
}

function SegmentedDonut({ data }: { data: { label: string, value: number, color: string }[] }) {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    const size = 180; // Un poco más grande para mejor legibilidad
    const center = size / 2;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2 - 15;
    const circumference = 2 * Math.PI * radius;

    let currentAngle = 0;
    // Añadimos un pequeño espacio (gap) entre segmentos si hay más de uno
    const gap = total > 0 ? 4 : 0;

    return (
        <div className="relative flex items-center justify-center group">
            <svg height={size} width={size} className="transform -rotate-90 overflow-visible">
                {/* Canal de fondo (track) */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#f8fafc"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {data.map((item, index) => {
                    if (item.value === 0) return null;

                    const percentage = item.value / total;
                    const segmentLength = percentage * circumference;
                    // El dashoffset en SVG es negativo para avanzar en sentido horario
                    const dashOffset = -currentAngle;

                    // Reducimos el arco visualmente para crear el efecto de "gap"
                    const visualLength = segmentLength - gap;
                    const dashArray = `${visualLength > 0 ? visualLength : 0} ${circumference}`;

                    currentAngle += segmentLength;

                    return (
                        <circle
                            key={index}
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke={item.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            fill="transparent"
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pedidos</span>
                <span className="text-4xl font-black text-[#1a1c1e] leading-none">{total}</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Totales</span>
            </div>
        </div>
    );
}

// ─── Dashboard Principal ────────────────────────────────────────────────────────

export function DashboardPage() {
    const navigate = useNavigate();
    const { data, isLoading } = useDashboard();

    if (isLoading) return <div className="min-h-screen bg-[#f4f7f9] animate-pulse p-12">Cargando sistema...</div>;

    const oldestOrders = data?.alerts.oldestOrders ?? [];

    return (
        <div className="min-h-screen bg-[#f4f7f9] p-8 pb-12 font-sans selection:bg-[#004d40] selection:text-white">

            <main className="max-w-[1400px] mx-auto px-8 mt-8 space-y-8">

                {/* ── SECCIÓN SUPERIOR ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Tarjeta Principal */}
                    <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-50 relative overflow-hidden flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-3xl font-black text-[#1a1c1e]">Balance General del Mes</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fondos Disponibles</p>
                                <div className="text-4xl font-black text-[#1a1c1e] tracking-tighter">{fmt(data?.financial.currentCash ?? 0)}</div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => navigate('/transactions')} className="bg-[#004d40] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#003d33] transition-all shadow-lg shadow-[#004d40]/20">Ver Finanzas</button>
                        </div>
                    </div>

                    {/* Banner Lateral */}
                    <div className="lg:col-span-4 bg-[#004d40] rounded-3xl p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <AlertCircle size={120} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <h3 className="text-xl font-black mb-4">Pedidos Críticos</h3>
                                <p className="text-emerald-100/70 text-sm leading-relaxed">
                                    Tienes {data?.alerts.ordersOver15Days} pedidos que han superado el tiempo máximo en bodega. Es necesario gestionar su entrega inmediata para evitar retrasos en facturación.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/orders/delivery')}
                                className="w-full bg-white text-[#004d40] py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-xl shadow-black/10 mt-6"
                            >
                                Revisar Alertas Críticas
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── KPI GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SmallCard label="Pendientes" value={data?.operational.ordersPending ?? 0} icon={Clock} color="bg-amber-500" />
                    <SmallCard label="En Bodega" value={data?.operational.ordersInWarehouse ?? 0} icon={Package} color="bg-blue-500" />
                    <SmallCard label="N° Clientes" value={data?.operational.totalActiveClients ?? 0} icon={Users} color="bg-rose-500" />
                    <SmallCard label="Entregados" value={data?.operational.totalOrdersDelivered ?? 0} icon={CheckCircle2} color="bg-emerald-500" />
                </div>

                {/* ── SECCIÓN INFERIOR ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* TABLA DE PEDIDOS ESTANCADOS (Left: 70%) */}
                    <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-[#1a1c1e]">Pedidos Estancados (+15 días)</h3>
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 cursor-pointer hover:bg-slate-200" onClick={() => navigate('/orders')}>
                                <ArrowUpRight size={20} />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                        <th className="pb-4">Fecha/Día</th>
                                        <th className="pb-4">Referencia</th>
                                        <th className="pb-4">Cliente</th>
                                        <th className="pb-4 text-center">Estado</th>
                                        <th className="pb-4 text-right">Valor</th>
                                        <th className="pb-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {oldestOrders.length > 0 ? oldestOrders.map((order) => (
                                        <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 font-bold text-xs text-slate-500">Hoy <span className="text-[10px] font-medium block text-slate-300">{order.days} días</span></td>
                                            <td className="py-4 font-black text-sm text-[#1a1c1e]">{order.id}</td>
                                            <td className="py-4 font-bold text-sm text-slate-600">{order.clientName}</td>
                                            <td className="py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Crítico
                                                </div>
                                            </td>
                                            <td className="py-4 text-right font-black text-sm text-[#1a1c1e]">{fmt(order.value)}</td>
                                            <td className="py-4 text-right"><ChevronDown size={14} className="text-slate-300 group-hover:text-slate-500" /></td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 italic">No hay pedidos estancados actualmente.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="mt-8 flex items-center justify-center">
                                <button onClick={() => navigate('/orders')} className="text-xs font-black text-[#004d40] hover:underline flex items-center gap-2">VER TODOS LOS PEDIDOS <ArrowUpRight size={14} /></button>
                            </div>
                        </div>
                    </div>

                    {/* GRÁFICO / RESUMEN (Right: 30%) */}
                    <div className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-sm border border-slate-50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-[#1a1c1e]">Estado de Pedidos</h3>
                            <MoreVertical size={20} className="text-slate-300 cursor-pointer" />
                        </div>

                        <div className="space-y-6">
                            <div className="py-2 flex flex-col items-center">
                                <SegmentedDonut data={[
                                    { label: 'Entregados', value: data?.operational.ordersByStatus.entregado ?? 0, color: '#004d40' },
                                    { label: 'Pendientes', value: data?.operational.ordersByStatus.recepcionado ?? 0, color: '#f59e0b' },
                                    { label: 'Por Recibir', value: data?.operational.ordersByStatus.porRecibir ?? 0, color: '#3b82f6' },
                                    { label: 'Cancelados', value: data?.operational.ordersByStatus.cancelado ?? 0, color: '#ef4444' }
                                ]} />

                                <div className="w-full mt-10 space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#004d40]" />
                                            <span className="text-xs font-bold text-slate-600">Entregados</span>
                                        </div>
                                        <span className="text-xs font-black text-[#1a1c1e] tracking-tight">{data?.operational.ordersByStatus.entregado ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <span className="text-xs font-bold text-slate-600">Pendientes</span>
                                        </div>
                                        <span className="text-xs font-black text-[#1a1c1e] tracking-tight">{data?.operational.ordersByStatus.recepcionado ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-xs font-bold text-slate-600">Pendientes de Recibir</span>
                                        </div>
                                        <span className="text-xs font-black text-[#1a1c1e] tracking-tight">{data?.operational.ordersByStatus.porRecibir ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
