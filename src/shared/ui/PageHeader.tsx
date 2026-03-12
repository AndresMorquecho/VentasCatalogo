import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    actions,
    className
}: PageHeaderProps) {
    return (
        <div className={cn(
            "bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6",
            className
        )}>
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="p-3 rounded-xl bg-monchito-purple/10 text-monchito-purple hidden sm:block">
                        <Icon className="h-6 w-6" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-slate-500 mt-2 font-medium">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
