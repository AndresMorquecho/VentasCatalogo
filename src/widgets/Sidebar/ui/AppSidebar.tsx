
import {
    LayoutDashboard,
    Inbox,
    Tag,
    Wallet,
    PackageCheck,
    Truck,
    Users,
    Calculator,
    Banknote,
    User,
    LogOut,
    Boxes,
    DollarSign,
    Phone,
    Award,
    Activity,
    Heart,
    Store,
    Settings2,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/shared/auth"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from "@/shared/ui/sidebar"
import { Button } from "@/shared/ui/button"
import { SidebarNavGroup } from "./SidebarNavGroup"

// ─── Sidebar Header: banner cuando expandido, logo-botón cuando colapsado ────
function CollapsibleHeader() {
    const { toggleSidebar } = useSidebar();

    return (
        <>
            {/* ── EXPANDIDO: banner a la izquierda + botón toggle a la derecha ── */}
            <div
                className="group-data-[collapsible=icon]:hidden flex items-center gap-2 bg-white"
                style={{ padding: '6px 10px 6px 12px', minHeight: 72 }}
            >
                {/* Banner ocupa todo el espacio disponible */}
                <img
                    src="/images/BannerHeader.jpg"
                    alt="TEMU Manager"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        maxHeight: 56,
                        objectFit: 'contain',
                        objectPosition: 'left center',
                        mixBlendMode: 'multiply',
                    }}
                />
                {/* Toggle button — a la derecha del banner */}
                <SidebarTrigger
                    className="shrink-0 h-7 w-7 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                />
            </div>

            {/* ── COLAPSADO: logo centrado, clic en cualquier parte expande ─── */}
            <button
                onClick={toggleSidebar}
                aria-label="Expandir menú"
                className="hidden group-data-[collapsible=icon]:flex w-full items-center justify-center cursor-pointer bg-white hover:bg-slate-50 transition-colors"
                style={{ minHeight: 56, border: 'none', padding: '8px 0' }}
            >
                <img
                    src="/images/mochitopng.png"
                    alt="Logo"
                    style={{
                        width: 34,
                        height: 34,
                        objectFit: 'contain',
                        mixBlendMode: 'multiply',
                    }}
                />
            </button>
        </>
    );
}

// --- Data Structure ---

// Top Level Items (Single)
const topLevelItems = [
    {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
    }
]

// Grouped Items (Collapsible)
const groupedItems = [
    {
        title: "Gestión Comercial",
        icon: Store, // Represents commercial activity
        items: [
            { title: "Empresarias", url: "/clients", icon: Users },
            { title: "Pedidos", url: "/orders", icon: Inbox },
            { title: "Recepción", url: "/orders/reception", icon: PackageCheck },
            { title: "Entregas", url: "/orders/delivery", icon: Truck },
        ]
    },
    {
        title: "Finanzas",
        icon: Banknote, // Represents money/finance
        items: [
            { title: "Transacciones", url: "/transactions", icon: DollarSign }, // Or Banknote again? DollarSign is generic
            { title: "Abonos", url: "/payments", icon: DollarSign },
            { title: "Cuentas", url: "/bank-accounts", icon: Wallet },
            { title: "Cierre de Caja", url: "/cash-closure", icon: Calculator },
        ]
    },
    {
        title: "Inventario",
        icon: Boxes, // Represents storage/boxes
        items: [
            { title: "Inventario", url: "/inventory", icon: Boxes },
            { title: "Marcas", url: "/brands", icon: Tag },
        ]
    },
    {
        title: "Seguimiento",
        icon: Activity, // Represents activity monitoring
        items: [
            { title: "Llamadas", url: "/calls", icon: Phone },
        ]
    },
    {
        title: "Fidelización",
        icon: Heart, // Represents loyalty
        items: [
            { title: "Fid. Recompensas", url: "/rewards", icon: Award },
        ]
    }
]

export function AppSidebar() {
    const { user, isAdmin, logout } = useAuth();
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-0 overflow-hidden">
                <CollapsibleHeader />
            </SidebarHeader>

            <SidebarContent>
                {/* 1. Main / Home Section (Single Items) */}
                <SidebarGroup>
                    <SidebarGroupLabel>Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {topLevelItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
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

                {/* 2. Grouped Sections (Collapsible) */}
                <SidebarGroup>
                    <SidebarGroupLabel>Módulos</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {groupedItems.map((group) => (
                                <SidebarNavGroup key={group.title} group={group} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 3. Admin-only Config Section */}
                {isAdmin() && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Configuración</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Usuarios y Roles">
                                        <Link to="/admin/users">
                                            <Settings2 />
                                            <span>Usuarios y Roles</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="border-t">
                <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border text-slate-600 shrink-0">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : 'Usuario'}</span>
                        <span className="text-xs text-muted-foreground truncate">{user?.role.name ?? ''}</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                </Button>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
