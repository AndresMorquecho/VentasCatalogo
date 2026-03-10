import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface MonchitoTabConfig {
    id: string;
    label: string;
    icon?: LucideIcon;
}

interface MonchitoTabsProps {
    tabs: MonchitoTabConfig[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
    fullWidth?: boolean;
}

export function MonchitoTabs({ tabs, activeTab, onTabChange, className, fullWidth }: MonchitoTabsProps) {
    return (
        <div className={cn(
            "bg-white rounded-xl border border-slate-200 p-1 flex flex-wrap gap-1 shadow-sm",
            fullWidth ? "w-full" : "w-fit",
            className
        )}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 min-w-0",
                            fullWidth ? "flex-1 justify-center px-1" : "whitespace-nowrap",
                            isActive
                                ? "bg-monchito-purple text-white shadow-md active:scale-95"
                                : "text-slate-500 hover:text-monchito-purple hover:bg-slate-50 active:bg-slate-100"
                        )}
                    >
                        {Icon && <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />}
                        <span className={cn("text-xs md:text-sm", fullWidth ? "truncate" : "")}>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
