
import { AlertTriangle, BadgeDollarSign, UserX, AlertOctagon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import type { FinancialMetrics, TrackingMetrics, WarehouseAlerts } from "../model/types";
import { cn } from "@/shared/lib/utils";
import { Link } from "react-router-dom";

interface StrategicAlertsBlockProps {
    alerts?: WarehouseAlerts;
    financial?: FinancialMetrics;
    tracking?: TrackingMetrics;
    loading: boolean;
}

interface AlertCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ReactNode;
    color: "red" | "yellow" | "green";
    actionLabel: string;
    actionUrl: string;
}

const colorStyles = {
    red: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        btn: "text-red-600 hover:text-red-700 hover:bg-red-100"
    },
    yellow: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        btn: "text-amber-600 hover:text-amber-700 hover:bg-amber-100"
    },
    green: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        btn: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
    }
};

function StrategicCard({ title, value, subtext, icon, color, actionLabel, actionUrl }: AlertCardProps) {
    const styles = colorStyles[color];

    return (
        <Card className={cn("border-l-4 shadow-sm transition-all hover:shadow-md", styles.bg, styles.border, `border-l-${color === 'red' ? 'red-500' : color === 'yellow' ? 'amber-500' : 'emerald-500'}`)}>
            <CardContent className="p-4 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div className={cn("p-2 rounded-full", styles.iconBg)}>
                        {icon}
                    </div>
                </div>

                <div>
                    <h3 className={cn("text-2xl font-bold mb-1", styles.text)}>{value}</h3>
                    <p className="text-sm text-slate-600 font-medium">{title}</p>
                    <p className="text-xs text-slate-500 mt-1">{subtext}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/50">
                    <Button variant="ghost" size="sm" className={cn("w-full justify-between px-0 h-auto font-semibold", styles.btn)} asChild>
                        <Link to={actionUrl}>
                            {actionLabel}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function StrategicAlertsBlock({ alerts, financial, tracking, loading }: StrategicAlertsBlockProps) {
    if (loading || !alerts || !financial || !tracking) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>;
    }

    // Calculations for strategic indicators
    const retainedRatio = financial.monthlyIncome > 0
        ? ((alerts.totalRetainedValue / financial.monthlyIncome) * 100).toFixed(1)
        : "0.0";

    const portfolioRatio = financial.monthlyIncome > 0
        ? ((financial.totalPortfolioPending / financial.monthlyIncome) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <AlertOctagon className="h-6 w-6 text-red-600" />
                Alertas Estratégicas - Riesgo Crítico
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* 1. Pedidos Retenidos (+15 días) */}
                <StrategicCard
                    title="Pedidos Retenidos (+15 días)"
                    value={alerts.ordersOver15Days}
                    subtext="Riesgo de devolución inminente"
                    icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
                    color={alerts.ordersOver15Days > 0 ? "red" : "green"}
                    actionLabel="Gestionar Envíos"
                    actionUrl="/orders/reception"
                />

                {/* 2. Dinero Congelado */}
                <StrategicCard
                    title="Dinero Congelado en Bodega"
                    value={`$${alerts.totalRetainedValue.toFixed(2)}`}
                    subtext={`${retainedRatio}% vs Ingresos Mensuales`}
                    icon={<BadgeDollarSign className="h-5 w-5 text-amber-600" />}
                    color={Number(retainedRatio) > 20 ? "red" : Number(retainedRatio) > 10 ? "yellow" : "green"}
                    actionLabel="Ver Inventario"
                    actionUrl="/inventory"
                />

                {/* 3. Cartera Pendiente */}
                <StrategicCard
                    title="Cartera Pendiente de Cobro"
                    value={`$${financial.totalPortfolioPending.toFixed(2)}`}
                    subtext={`${portfolioRatio}% vs Ventas Totales`}
                    icon={<BadgeDollarSign className="h-5 w-5 text-amber-600" />}
                    color={Number(portfolioRatio) > 15 ? "red" : Number(portfolioRatio) > 5 ? "yellow" : "green"}
                    actionLabel="Gestionar Cobros"
                    actionUrl="/payments"
                />

                {/* 4. Pedidos sin Seguimiento */}
                <StrategicCard
                    title="Pedidos Sin Seguimiento"
                    value={tracking.ordersWithoutCall7Days}
                    subtext="Sin contacto en > 7 días"
                    icon={<UserX className="h-5 w-5 text-red-600" />}
                    color={tracking.ordersWithoutCall7Days > 5 ? "red" : tracking.ordersWithoutCall7Days > 0 ? "yellow" : "green"}
                    actionLabel="Realizar Llamadas"
                    actionUrl="/calls"
                />
            </div>
        </div>
    );
}
