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
    Gift,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/shared/auth"
import { LogoutDialog } from "@/shared/components/LogoutDialog"
import { useState } from "react"

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
} from "@/shared/ui/sidebar"
import { Button } from "@/shared/ui/button"
import { SidebarNavGroup } from "./SidebarNavGroup"

// ─── Sidebar Header: banner cuando expandido, logo-botón cuando colapsado ────
function CollapsibleHeader() {
    return (
        <>
            {/* ── EXPANDIDO: banner a la izquierda ── */}
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
            </div>

            {/* ── COLAPSADO: logo centrado ─── */}
            <div
                className="hidden group-data-[collapsible=icon]:flex w-full items-center justify-center bg-white"
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
            </div>
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
            { title: "Transacciones", url: "/transactions", icon: DollarSign },
            { title: "Abonos", url: "/payments", icon: DollarSign },
            { title: "Saldos a Favor", url: "/client-credits", icon: Gift },
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
        icon: Heart,
        items: [
            { title: "Fid. Recompensas", url: "/rewards", icon: Award },
        ]
    }
]

export function AppSidebar() {
    const { user, logout, isAdmin } = useAuth();
    const adminMode = isAdmin();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = () => {
        logout();
    };

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
                {adminMode && (
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
                        <span className="text-sm font-medium truncate">{user?.username || 'Usuario'}</span>
                        <span className="text-xs text-muted-foreground truncate">{user?.role?.name || 'Vendedor'}</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                    onClick={() => setShowLogoutDialog(true)}
                >
                    <LogOut className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                </Button>
            </SidebarFooter>
            <SidebarRail />

            <LogoutDialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                onConfirm={handleLogout}
            />
        </Sidebar>
    )
}