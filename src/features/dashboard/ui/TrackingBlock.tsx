
import { Phone, UserX, Clock } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { TrackingMetrics } from "../model/types";
import { Skeleton } from "@/shared/ui/skeleton";

interface TrackingBlockProps {
    data?: TrackingMetrics;
    loading: boolean;
}

export function TrackingBlock({ data, loading }: TrackingBlockProps) {
    if (loading || !data) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-600" />
                Seguimiento y Gestión
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    title="Llamadas Hoy"
                    value={data.callsMadeToday}
                    icon={<Phone className="h-5 w-5 text-purple-600" />}
                    color="info"
                    trend={5}
                    description="vs ayer"
                />
                <KpiCard
                    title="Sin Llamada (7 días)"
                    value={data.ordersWithoutCall7Days}
                    icon={<Clock className="h-5 w-5 text-amber-600" />}
                    color="warning"
                    description="Pedidos olvidados"
                />
                <KpiCard
                    title="Sin Seguimiento"
                    value={data.clientsWithoutRecentFollowup}
                    icon={<UserX className="h-5 w-5 text-red-600" />}
                    color="danger"
                    description="Clientes descuidados"
                />
            </div>
        </div>
    );
}

