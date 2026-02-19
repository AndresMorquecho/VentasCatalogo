
import { DollarSign, Wallet, Calendar } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { FinancialMetrics } from "../model/types";
import { Skeleton } from "@/shared/ui/skeleton";

interface FinancialBlockProps {
    data?: FinancialMetrics;
    loading: boolean;
}

export function FinancialBlock({ data, loading }: FinancialBlockProps) {
    if (loading || !data) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Finanzas y Pagos
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Ingresos Hoy"
                    value={`$${data.dailyIncome.toFixed(2)}`}
                    icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                    color="success"
                    trend={12}
                    description="vs ayer"
                />
                <KpiCard
                    title="Ingresos del Mes"
                    value={`$${data.monthlyIncome.toFixed(2)}`}
                    icon={<Calendar className="h-5 w-5 text-blue-600" />}
                    color="info"
                    description="Acumulado mensual"
                />
                <KpiCard
                    title="Cartera Pendiente"
                    value={`$${data.totalPortfolioPending.toFixed(2)}`}
                    icon={<Wallet className="h-5 w-5 text-amber-600" />}
                    color="warning"
                    description="Total por cobrar"
                />
                <KpiCard
                    title="Caja Actual"
                    value={`$${data.currentCash.toFixed(2)}`}
                    icon={<DollarSign className="h-5 w-5 text-slate-600" />}
                    color="default"
                    description="Saldo disponible"
                />
            </div>
        </div>
    );
}
