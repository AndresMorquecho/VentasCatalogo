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
            <div className="flex items-center gap-3 sm:gap-4 truncate">
                {Icon && (
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-monchito-purple/10 text-monchito-purple shrink-0">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                )}
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none truncate">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2 font-medium truncate">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto md:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}
