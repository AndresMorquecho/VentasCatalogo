
import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/shared/ui/sidebar"

// Type for a single navigation item
export type NavItem = {
    title: string
    url: string
    icon?: LucideIcon
}

// Type for a group of items
export type NavGroup = {
    title: string
    icon: LucideIcon
    items: NavItem[]
}

interface SidebarNavGroupProps {
    group: NavGroup
    isOpen: boolean
    onToggle: () => void
}

export function SidebarNavGroup({ group, isOpen, onToggle }: SidebarNavGroupProps) {
    const location = useLocation()

    // Check if any child is active to auto-expand
    const isChildActive = group.items.some(item => location.pathname === item.url || location.pathname.startsWith(item.url + '/'))

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={onToggle}
                tooltip={group.title}
                isActive={isChildActive}
                className={`
                    h-10 rounded-xl transition-all duration-300 font-bold tracking-tight
                    ${isChildActive ? 'bg-monchito-purple/5 text-monchito-purple' : 'hover:bg-slate-100 text-slate-600'}
                `}
            >
                <group.icon className="size-5" />
                <span>{group.title}</span>
                <ChevronRight
                    className={`ml-auto h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                />
            </SidebarMenuButton>

            {/* Submenu with refined styling */}
            <div className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isOpen ? 'max-h-[500px] opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}
            `}>
                <SidebarMenuSub className="border-l border-slate-100 ml-4 pl-2 space-y-1">
                    {group.items.map((item) => {
                        const isActive = location.pathname === item.url
                        return (
                            <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton asChild isActive={isActive} size="md" className="rounded-lg h-9 transition-colors hover:bg-slate-50">
                                    <Link to={item.url} className="flex items-center">
                                        {item.icon && <item.icon className={`h-4 w-4 mr-2.5 ${isActive ? 'text-monchito-teal' : 'text-slate-400'}`} />}
                                        <span className={`text-xs font-semibold ${isActive ? 'text-monchito-purple font-bold' : 'text-slate-500'}`}>
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        )
                    })}
                </SidebarMenuSub>
            </div>
        </SidebarMenuItem>
    )
}
