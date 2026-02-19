
import { AlertTriangle, Clock, BadgeDollarSign, Archive } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { WarehouseAlerts } from "../model/types";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";

interface AlertsBlockProps {
    data?: WarehouseAlerts;
    loading: boolean;
}

export function AlertsBlock({ data, loading }: AlertsBlockProps) {
    if (loading || !data) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 animate-pulse">
                <AlertTriangle className="h-5 w-5" />
                Alertas Críticas de Bodega
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <KpiCard
                    title="Más de 15 Días"
                    value={data.ordersOver15Days}
                    icon={<Clock className="h-5 w-5 text-amber-600" />}
                    color="warning"
                    description="Requieren atención"
                />
                <KpiCard
                    title="Más de 30 Días"
                    value={data.ordersOver30Days}
                    icon={<Archive className="h-5 w-5 text-red-600" />}
                    color="danger"
                    description="Riesgo de devolución"
                />
                <KpiCard
                    title="Dinero Retenido"
                    value={`$${data.totalRetainedValue.toFixed(2)}`}
                    icon={<BadgeDollarSign className="h-5 w-5 text-red-600" />}
                    color="danger"
                    description="Total en inventario"
                />
            </div>

            {/* Top Oldest Orders List */}
            {data.oldestOrders.length > 0 && (
                <Card className="border-red-100 bg-red-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">
                            Top Pedidos Más Antiguos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.oldestOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between text-sm p-2 bg-white rounded border border-red-100 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">{order.clientName}</span>
                                        <span className="text-xs text-slate-500">ID: {order.id}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-red-600">{order.days} días</span>
                                        <span className="text-xs text-slate-600">${order.value.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
