
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
                className="font-medium"
            >
                <group.icon />
                <span>{group.title}</span>
                <ChevronRight
                    className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                />
            </SidebarMenuButton>

            {/* Simple Conditional Rendering for now as we lack a transition library wrapper */}
            {isOpen && (
                <SidebarMenuSub>
                    {group.items.map((item) => {
                        const isActive = location.pathname === item.url
                        return (
                            <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton asChild isActive={isActive} size="md">
                                    <Link to={item.url}>
                                        {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        )
                    })}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    )
}
