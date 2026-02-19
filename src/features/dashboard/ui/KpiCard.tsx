
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number; // percentage, positive or negative
    description?: string;
    color?: "default" | "success" | "warning" | "danger" | "info";
    loading?: boolean;
}

const colorMap = {
    default: "text-slate-600 bg-slate-100",
    success: "text-emerald-600 bg-emerald-100",
    warning: "text-amber-600 bg-amber-100",
    danger: "text-red-600 bg-red-100",
    info: "text-blue-600 bg-blue-100",
};

export function KpiCard({
    title,
    value,
    icon,
    trend,
    description,
    color = "default",
    loading = false
}: KpiCardProps) {
    if (loading) {
        return <Skeleton className="h-32 w-full rounded-xl" />;
    }

    return (
        <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-2 text-slate-900">{value}</h3>
                    </div>
                    <div className={cn("p-3 rounded-full", colorMap[color])}>
                        {icon}
                    </div>
                </div>

                {(trend !== undefined || description) && (
                    <div className="mt-4 flex items-center gap-2 text-xs">
                        {trend !== undefined && (
                            <span className={cn(
                                "flex items-center font-medium",
                                trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-600" : "text-slate-600"
                            )}>
                                {trend > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                {Math.abs(trend)}%
                            </span>
                        )}
                        {description && (
                            <span className="text-muted-foreground">{description}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
