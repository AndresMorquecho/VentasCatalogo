
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import type { DashboardData } from "../model/types";

interface DashboardChartsProps {
    data?: DashboardData['charts'];
    loading: boolean;
}

export function DashboardCharts({ data, loading }: DashboardChartsProps) {
    if (loading || !data) {
        return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
        </div>;
    }

    // 1. Line Chart Helper (Sales Trend)
    const renderLineChart = () => {
        const maxVal = Math.max(...data.salesTrend.map(d => d.amount)) || 100;
        const chartH = 200;
        const chartW = 500;
        const points = data.salesTrend.map((d, i) => {
            const x = (i / (data.salesTrend.length - 1)) * chartW;
            const y = chartH - (d.amount / maxVal) * chartH;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="relative h-[250px] w-full overflow-hidden flex flex-col justify-end pb-6">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                        <line key={i} x1="0" y1={chartH * pct} x2={chartW} y2={chartH * pct} stroke="#E2E8F0" strokeWidth="1" />
                    ))}
                    {/* Path */}
                    <polyline points={points} fill="none" stroke="#059669" strokeWidth="3" />
                    {/* Dots */}
                    {data.salesTrend.map((d, i) => {
                        const x = (i / (data.salesTrend.length - 1)) * chartW;
                        const y = chartH - (d.amount / maxVal) * chartH;
                        return (
                            <circle key={i} cx={x} cy={y} r="4" fill="#059669" stroke="#fff" strokeWidth="2" />
                        );
                    })}
                </svg>
                {/* X Axis Labels */}
                <div className="absolute bottom-0 w-full flex justify-between text-xs text-slate-500 px-1">
                    {data.salesTrend.map((d, i) => (
                        <span key={i}>{d.date}</span>
                    ))}
                </div>
            </div>
        );
    };

    // 2. Donut Chart Helper (CSS Conic Gradient)
    const renderDonutChart = () => {
        let currentAngle = 0;
        const total = data.orderStatus.reduce((acc, curr) => acc + curr.count, 0);
        const segments = data.orderStatus.map((status) => {
            const percentage = (status.count / total) * 100;
            const start = currentAngle;
            const end = currentAngle + percentage;
            currentAngle = end;
            return `${status.color} ${start}% ${end}%`;
        }).join(', ');

        const gradient = `conic-gradient(${segments})`;

        return (
            <div className="relative flex items-center justify-center h-[200px]">
                <div
                    className="rounded-full"
                    style={{
                        width: '160px',
                        height: '160px',
                        background: gradient
                    }}
                >
                    {/* Inner White Circle for Donut */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-[100px] h-[100px] flex items-center justify-center shadow-inner">
                        <span className="text-2xl font-bold text-slate-700">{total}</span>
                    </div>
                </div>
                {/* Legend */}
                <div className="absolute bottom-[-40px] flex gap-3 text-xs flex-wrap justify-center w-full">
                    {data.orderStatus.map((s, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ background: s.color }}></span>
                            <span>{s.status} ({s.count})</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 3. Bar Chart Helper (Warehouse Time)
    const renderBarChart = () => {
        const maxDays = Math.max(...data.warehouseTimeTrend.map(d => d.days)) || 10;
        return (
            <div className="h-[200px] flex items-end justify-around gap-4 pt-10 pb-6 w-full">
                {data.warehouseTimeTrend.map((d, i) => {
                    const heightPct = (d.days / maxDays) * 100;
                    return (
                        <div key={i} className="flex flex-col items-center w-12 group">
                            <div className="relative w-full bg-blue-100 rounded-t-lg overflow-hidden flex items-end h-[150px]">
                                <div
                                    className="w-full bg-blue-500 transition-all duration-500 ease-out group-hover:bg-blue-600 relative"
                                    style={{ height: `${heightPct}%` }}
                                >
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {d.days}d
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500 mt-2 font-medium">{d.month}</span>
                        </div>
                    )
                })}
            </div>
        );
    };

    // 4. Comparison Chart (Payments vs Pending)
    const renderComparisonChart = () => {
        const { value1, value2 } = data.comparison; // value1: Paid, value2: Pending
        const max = Math.max(value1, value2) * 1.2 || 100;
        const p1 = (value1 / max) * 100;
        const p2 = (value2 / max) * 100;

        return (
            <div className="h-[200px] flex flex-col justify-center gap-6 px-4">
                {/* Received */}
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-emerald-700 font-medium">Abonos Recibidos</span>
                        <span className="font-bold text-emerald-700">${value1.toFixed(2)}</span>
                    </div>
                    <div className="h-4 bg-emerald-100 rounded-full w-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p1}%` }} />
                    </div>
                </div>

                {/* Pending */}
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-amber-700 font-medium">Saldo Pendiente</span>
                        <span className="font-bold text-amber-700">${value2.toFixed(2)}</span>
                    </div>
                    <div className="h-4 bg-amber-100 rounded-full w-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${p2}%` }} />
                    </div>
                </div>

                <div className="pt-4 text-xs text-center text-slate-400">
                    Comparativa Financiera General
                </div>
            </div>
        );
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Sales Trend */}
            <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-100">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-500">Ventas últimos 30 días</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderLineChart()}
                </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card className="col-span-1 shadow-sm border-slate-100 pb-8">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-500">Estado de Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderDonutChart()}
                </CardContent>
            </Card>

            {/* Average Warehouse Time Trend */}
            <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-100">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-500">Tendencia Promedio Días en Bodega</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderBarChart()}
                </CardContent>
            </Card>

            {/* Comparison */}
            <Card className="col-span-1 shadow-sm border-slate-100">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-500">Abonos vs Saldo Pendiente</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderComparisonChart()}
                </CardContent>
            </Card>
        </div>
    );
}
