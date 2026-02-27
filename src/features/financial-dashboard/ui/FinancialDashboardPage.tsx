import { useMemo } from 'react';
import { useFinancialDashboard } from '../model/useFinancialDashboard';
import { useBankAccountList } from '@/features/bank-accounts/api/hooks';
import { useFinancialRecords } from '@/entities/financial-record/model/queries';
import { useClients } from '@/entities/client/model/hooks';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Filter
} from 'lucide-react';
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

export function FinancialDashboardPage() {
    const { summary, loading: summaryLoading, error: summaryError } = useFinancialDashboard();
    const { data: bankAccounts = [] } = useBankAccountList();
    const { data: records = [], isLoading: recordsLoading } = useFinancialRecords();
    const { data: clients = [], isLoading: clientsLoading } = useClients();

    const loading = summaryLoading || recordsLoading || clientsLoading;

    // --- Prepare Chart Data ---

    // 1. Sales Analytics (Last 12 months or 12 periods)
    const salesData = useMemo(() => {
        if (!records.length) return [];

        const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Group by month of the current year (simplified for demo)
        const currentYear = new Date().getFullYear();
        const monthlyData = months.map(m => ({ label: m, value: 0 }));

        sortedRecords.forEach(r => {
            const date = new Date(r.date);
            if (date.getFullYear() === currentYear && r.movementType === 'INCOME') {
                monthlyData[date.getMonth()].value += r.amount;
            }
        });

        return monthlyData;
    }, [records]);

    // 2. Invoice Statistics (Donut Chart representation)
    const invoiceStats = useMemo(() => {
        const total = summary.movementCount || 1;
        const paid = summary.bySource.ORDER_PAYMENT.count;
        const manual = summary.bySource.MANUAL.count;
        const adjustments = summary.bySource.ADJUSTMENT.count;

        return {
            total: summary.movementCount,
            paid: { count: paid, percent: Math.round((paid / total) * 100), color: '#3b82f6' },
            manual: { count: manual, percent: Math.round((manual / total) * 100), color: '#111827' },
            adjustments: { count: adjustments, percent: Math.round((adjustments / total) * 100), color: '#94a3b8' }
        };
    }, [summary]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2" />
                    <p className="text-muted-foreground font-medium animate-pulse">Cargando inteligencia financiera...</p>
                </div>
            </div>
        );
    }

    if (summaryError) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-4">
                    <TrendingDown className="h-8 w-8" />
                    <div>
                        <h3 className="font-bold text-lg">Error de Conexión</h3>
                        <p className="opacity-80">No pudimos sincronizar los datos financieros: {summaryError.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    const recentRecords = records.slice(0, 5);

    return (
        <div className="p-4 lg:p-8 space-y-8 bg-white min-h-screen">
            {/* --- Top Metrics --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Customers */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Clientes</p>
                                <h3 className="text-3xl font-black text-slate-900">{clients.length}</h3>
                                <div className="flex items-center gap-1 mt-2 text-emerald-500 font-bold text-xs">
                                    <ArrowUpRight className="h-3 w-3" />
                                    <span>+6.5% <span className="text-slate-400 font-medium">vs la semana pasada</span></span>
                                </div>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-xl">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue (Ingresos) */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Ingresos</p>
                                <h3 className="text-3xl font-black text-slate-900">{formatCurrency(summary.totalIncome)}</h3>
                                <div className="flex items-center gap-1 mt-2 text-rose-500 font-bold text-xs">
                                    <ArrowDownRight className="h-3 w-3" />
                                    <span>-0.10% <span className="text-slate-400 font-medium">vs el mes pasado</span></span>
                                </div>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profit (Balance Neto) */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Balance Neto</p>
                                <h3 className="text-3xl font-black text-slate-900">{formatCurrency(summary.netBalance)}</h3>
                                <div className="flex items-center gap-1 mt-2 text-rose-500 font-bold text-xs">
                                    <ArrowDownRight className="h-3 w-3" />
                                    <span>-0.2% <span className="text-slate-400 font-medium">de margen operativo</span></span>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <DollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoices (Movimientos) */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Movimientos</p>
                                <h3 className="text-3xl font-black text-slate-900">{summary.movementCount}</h3>
                                <div className="flex items-center gap-1 mt-2 text-indigo-500 font-bold text-xs">
                                    <ArrowUpRight className="h-3 w-3" />
                                    <span>+11.5% <span className="text-slate-400 font-medium">volumen transaccional</span></span>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <FileText className="h-6 w-6 text-slate-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Invoice Statistics (Donut) */}
                <Card className="lg:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden flex flex-col">
                    <div className="p-6 pb-0 flex justify-between items-center">
                        <h4 className="font-black text-slate-800">Estadísticas de Pagos</h4>
                        <MoreHorizontal className="h-5 w-5 text-slate-400" />
                    </div>
                    <CardContent className="flex-1 p-6 flex flex-col items-center justify-center">
                        <div className="relative h-48 w-48 mb-8">
                            {/* Simple SVG Donut Chart */}
                            <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                <circle
                                    cx="50" cy="50" r="40" fill="transparent"
                                    stroke={invoiceStats.paid.color}
                                    strokeWidth="12"
                                    strokeDasharray={`${invoiceStats.paid.percent * 2.51} 251`}
                                />
                                <circle
                                    cx="50" cy="50" r="40" fill="transparent"
                                    stroke={invoiceStats.manual.color}
                                    strokeWidth="12"
                                    strokeDasharray={`${invoiceStats.manual.percent * 2.51} 251`}
                                    strokeDashoffset={`-${invoiceStats.paid.percent * 2.51}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <p className="text-3xl font-black text-slate-900">{invoiceStats.total}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Movimientos</p>
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="text-sm font-bold text-slate-600">Pagos de Órdenes</span>
                                </div>
                                <span className="font-black text-slate-900">{invoiceStats.paid.count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-slate-900" />
                                    <span className="text-sm font-bold text-slate-600">Manuales</span>
                                </div>
                                <span className="font-black text-slate-900">{invoiceStats.manual.count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                                    <span className="text-sm font-bold text-slate-600">Ajustes</span>
                                </div>
                                <span className="font-black text-slate-900">{invoiceStats.adjustments.count}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Analytics (Line Chart) */}
                <Card className="lg:col-span-8 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden flex flex-col">
                    <div className="p-6 pb-0 flex justify-between items-center">
                        <h4 className="font-black text-slate-800">Analítica de Ventas</h4>
                        <MoreHorizontal className="h-5 w-5 text-slate-400" />
                    </div>
                    <CardContent className="flex-1 p-6 pt-12 flex flex-col">
                        <div className="flex-1 min-h-[250px] relative group">
                            {/* Simple Vertical Bar Chart as placeholder for Line Chart without libraries */}
                            <div className="absolute inset-0 flex items-end justify-between gap-1">
                                {salesData.map((d, i) => {
                                    const maxVal = Math.max(...salesData.map(v => v.value)) || 1;
                                    const height = (d.value / maxVal) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                            <div className="w-full relative">
                                                <div
                                                    className="w-full bg-indigo-500/10 hover:bg-indigo-500/30 rounded-t-lg transition-all duration-500 cursor-pointer flex items-end justify-center group-hover/bar:bg-indigo-600"
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                >
                                                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap z-10">
                                                        ${d.value.toFixed(0)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{d.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Horizontal guide lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
                                {[1, 2, 3, 4, 5].map(v => (
                                    <div key={v} className="w-full border-t border-slate-300 border-dashed" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- Recent Records Table --- */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b border-slate-50">
                    <h4 className="font-black text-slate-800">Movimientos Recientes</h4>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="flex items-center gap-2 py-1.5 px-3 border-2 font-bold cursor-pointer hover:bg-slate-50">
                            <Filter className="h-3.5 w-3.5" />
                            Filtrar
                        </Badge>
                        <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-6 py-4">No</th>
                                    <th className="px-6 py-4">Referencia</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Cuenta</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentRecords.map((record, index) => (
                                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-400">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900">{record.referenceNumber.split('-')[0]}...</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                                    <AvatarFallback className="bg-indigo-500 text-white text-[10px] font-black">
                                                        {record.clientName?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-bold text-slate-700">{record.clientName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                {bankAccounts.find(a => a.id === record.bankAccountId)?.name || 'Caja'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500 italic">
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`font-black text-[9px] uppercase tracking-wider ${record.movementType === 'INCOME'
                                                ? 'bg-emerald-100 text-emerald-700 border-none'
                                                : 'bg-rose-100 text-rose-700 border-none'
                                                }`}>
                                                {record.movementType === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black tracking-tight ${record.movementType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                {formatCurrency(record.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {recentRecords.length === 0 && (
                        <div className="p-20 text-center">
                            <p className="text-slate-400 font-bold italic">No hay movimientos registrados recientemente</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

