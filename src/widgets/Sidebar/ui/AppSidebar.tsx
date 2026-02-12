import { Calendar, Home, Inbox, Search, Settings, Tag, Wallet, PackageCheck, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/shared/ui/sidebar"

// Main menu items
const mainItems = [
    {
        title: "Inicio",
        url: "/",
        icon: Home,
    },
]

// Operations menu
const operationsItems = [
    {
        title: "Pedidos",
        url: "/orders",
        icon: Inbox,
    },
    {
        title: "Recepción",
        url: "/orders/reception",
        icon: PackageCheck,
    },
    {
        title: "Entregas",
        url: "/orders/delivery",
        icon: Truck,
    },
    {
        title: "Marcas",
        url: "/brands",
        icon: Tag,
    },
    {
        title: "Cuentas",
        url: "/bank-accounts",
        icon: Wallet,
    },
]

// System menu
const systemItems = [
    {
        title: "Calendario",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Búsqueda",
        url: "#",
        icon: Search,
    },
    {
        title: "Configuración",
        url: "#",
        icon: Settings,
    },
]

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                {/* Main Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Operations Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>Operaciones</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {operationsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* System Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>Sistema</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {systemItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
