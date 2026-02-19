
import { Award, UserCheck, Star } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { LoyaltyMetrics } from "../model/types";
import { Skeleton } from "@/shared/ui/skeleton";

interface LoyaltyBlockProps {
    data?: LoyaltyMetrics;
    loading: boolean;
}

export function LoyaltyBlock({ data, loading }: LoyaltyBlockProps) {
    if (loading || !data) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Fidelización y Recompensas
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    title="Puntos Generados"
                    value={data.pointsGeneratedThisMonth}
                    icon={<Award className="h-5 w-5 text-amber-500" />}
                    color="warning"
                    description="Acumulado mensual"
                />
                <KpiCard
                    title="Canjes Realizados"
                    value={data.redemptionsMade}
                    icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
                    color="success"
                    description="Premios entregados"
                />
                {/* Simple List for Top Clients */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-500">Top Clientes</span>
                        <Award className="h-4 w-4 text-amber-500" />
                    </div>
                    <ul className="space-y-2">
                        {data.topClients.map((client, i) => (
                            <li key={i} className="flex justify-between text-sm">
                                <span className="font-medium text-slate-800">{client.name}</span>
                                <span className="text-amber-600 font-bold">{client.points} pts</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
