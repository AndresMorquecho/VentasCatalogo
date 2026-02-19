
import { Package, Truck, Clock } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { OperationalMetrics } from "../model/types";
import { Skeleton } from "@/shared/ui/skeleton";

interface OperationalBlockProps {
    data?: OperationalMetrics;
    loading: boolean;
}

export function OperationalBlock({ data, loading }: OperationalBlockProps) {
    if (loading || !data) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Operaciones (Bodega & Envíos)
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Recibidos Hoy"
                    value={data.ordersReceivedToday}
                    icon={<Package className="h-5 w-5 text-blue-600" />}
                    color="info"
                    trend={10} // Example trend
                    description="vs ayer"
                />
                <KpiCard
                    title="En Bodega Actual"
                    value={data.ordersInWarehouse}
                    icon={<Clock className="h-5 w-5 text-amber-600" />}
                    color="warning"
                    description="Paquetes físicos"
                />
                <KpiCard
                    title="Entregados Hoy"
                    value={data.ordersDeliveredToday}
                    icon={<Truck className="h-5 w-5 text-emerald-600" />}
                    color="success"
                    trend={5}
                    description="vs semana pasada"
                />
                <KpiCard
                    title="Tiempo Promedio"
                    value={`${data.averageWarehouseTimeDays} días`}
                    icon={<Clock className="h-5 w-5 text-slate-600" />}
                    color="default"
                    description="Permanencia en bodega"
                />
            </div>
        </div>
    );
}
