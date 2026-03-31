
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
    color?: "default" | "success" | "warning" | "danger" | "info" | "primary";
    loading?: boolean;
    sparklineData?: number[];
}

function Sparkline({ data, color = "currentColor" }: { data: number[]; color?: string }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const height = 30;
    const width = 100;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-50 overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-700"
            />
        </svg>
    );
}

const colorMap = {
    default: "text-slate-600 bg-slate-100/50 border-slate-200",
    success: "text-emerald-600 bg-emerald-50 border-emerald-100",
    warning: "text-amber-600 bg-amber-50 border-amber-100",
    danger: "text-red-600 bg-red-50 border-red-100",
    info: "text-blue-600 bg-blue-50 border-blue-100",
    primary: "text-monchito-purple bg-monchito-purple/5 border-monchito-purple/10",
};

export function KpiCard({
    title,
    value,
    icon,
    trend,
    description,
    color = "default",
    loading = false,
    sparklineData
}: KpiCardProps) {
    if (loading) {
        return <Skeleton className="h-32 w-full rounded-xl" />;
    }

    return (
        <Card className="overflow-hidden border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display">{title}</p>
                        <h3 className="text-2xl font-black text-slate-900 font-display tracking-tight group-hover:text-monchito-purple transition-colors">{value}</h3>
                    </div>
                    <div className={cn("p-2.5 rounded-xl border transition-all duration-300 group-hover:rotate-12", colorMap[color])}>
                        {icon}
                    </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        {trend !== undefined && (
                            <div className="flex items-center gap-1">
                                <span className={cn(
                                    "flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-md",
                                    trend > 0 ? "bg-emerald-100 text-emerald-700" : trend < 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                                )}>
                                    {trend > 0 ? <ArrowUp className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDown className="h-2.5 w-2.5 mr-0.5" />}
                                    {Math.abs(trend)}%
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">vs mes anterior</span>
                            </div>
                        )}
                        {description && (
                            <span className="text-[10px] font-bold text-slate-400/80 uppercase tracking-wider">{description}</span>
                        )}
                    </div>
                    
                    {sparklineData && (
                         <div className="pb-1">
                            <Sparkline 
                                data={sparklineData} 
                                color={trend !== undefined ? (trend >= 0 ? "#10b981" : "#ef4444") : "#6366f1"} 
                            />
                         </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
