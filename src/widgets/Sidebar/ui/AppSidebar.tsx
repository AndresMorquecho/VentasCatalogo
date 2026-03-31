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
    LogOut,
    Boxes,
    DollarSign,
    Phone,
    Award,
    Activity,
    Heart,
    Store,
    Settings2,
    CheckCircle,
    ArrowLeftRight,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/shared/auth"
import { LogoutDialog } from "@/shared/components/LogoutDialog"
import { useState, useEffect } from "react"

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
        <div className="relative overflow-hidden">
            {/* --- EXPANDED --- */}
            <div className="group-data-[collapsible=icon]:hidden flex items-center justify-center p-4 min-h-[80px] relative z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <img
                    src="/images/BannerHeader.jpg"
                    alt="TEMU Manager"
                    className="h-12 w-auto object-contain mix-blend-multiply"
                />
            </div>

            {/* --- COLLAPSED --- */}
            <div className="hidden group-data-[collapsible=icon]:flex w-full items-center justify-center py-4 bg-white relative z-10">
                <img
                    src="/images/mochitopng.png"
                    alt="Logo"
                    className="w-8 h-8 object-contain mix-blend-multiply transition-transform hover:scale-110 duration-300"
                />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
        </div>
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
        icon: Store,
        items: [
            { title: "Empresarias", url: "/clients", icon: Users },
            { title: "Pedidos", url: "/orders", icon: Inbox },
            { title: "Recepción", url: "/orders/reception", icon: PackageCheck },
            { title: "Entregas", url: "/orders/delivery", icon: Truck },
            { title: "Cambios", url: "/exchanges", icon: ArrowLeftRight },
        ]
    },
    {
        title: "Finanzas",
        icon: Banknote, // Represents money/finance
        items: [
            { title: "Transacciones", url: "/transactions", icon: DollarSign },
            { title: "Abonos", url: "/payments", icon: DollarSign },
            { title: "Billetera Virtual", url: "/wallet", icon: Wallet },
            { title: "Validación de Pagos", url: "/wallet-validations", icon: CheckCircle },
            { title: "Cuentas Bancarias", url: "/bank-accounts", icon: Store },
            { title: "Cierre de Caja", url: "/cash-closure", icon: Calculator },
            { title: "Análisis de Cartera", url: "/cartera", icon: Activity },
        ]
    },
    {
        title: "Inventario",
        icon: Boxes, // Represents storage/boxes
        items: [
            { title: "Inventario", url: "/inventory", icon: Boxes },
            { title: "Marcas", url: "/brands", icon: Tag },
            { title: "Catálogos", url: "/catalogs", icon: Inbox },
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

const getAvatarColor = (name: string) => {
    const colors = [
        "bg-red-500", "bg-blue-500", "bg-green-500", "bg-amber-500",
        "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500",
        "bg-teal-500", "bg-cyan-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export function AppSidebar() {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const adminMode = isAdmin();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    
    // Track which group is open (null means all closed)
    // Initial state: try to find the group that contains the current location
    const [openGroupTitle, setOpenGroupTitle] = useState<string | null>(() => {
        const activeGroup = groupedItems.find(group => 
            group.items.some(item => location.pathname === item.url || location.pathname.startsWith(item.url + '/'))
        );
        return activeGroup ? activeGroup.title : null;
    });

    // Auto-expand if navigating to a child
    useEffect(() => {
        const activeGroup = groupedItems.find(group => 
            group.items.some(item => location.pathname === item.url || location.pathname.startsWith(item.url + '/'))
        );
        if (activeGroup && activeGroup.title !== openGroupTitle) {
            setOpenGroupTitle(activeGroup.title);
        }
    }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLogout = () => {
        logout();
    };

    const userName = user?.username || 'Usuario';
    const userInitial = userName.charAt(0).toUpperCase();
    const avatarColor = getAvatarColor(userName);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-0 overflow-hidden">
                <CollapsibleHeader />
            </SidebarHeader>

            <SidebarContent className="no-scrollbar px-2 py-4 space-y-4">
                {/* 1. Main / Home Section (Single Items) */}
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                        Principal
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {topLevelItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton 
                                        asChild 
                                        tooltip={item.title}
                                        className="h-10 rounded-xl hover:bg-slate-100 transition-all duration-300"
                                    >
                                        <Link to={item.url}>
                                            <item.icon className="size-5" />
                                            <span className="font-semibold tracking-tight">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 2. Grouped Sections (Collapsible) */}
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                        Módulos
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-2">
                            {groupedItems.map((group) => (
                                <SidebarNavGroup 
                                    key={group.title} 
                                    group={group} 
                                    isOpen={openGroupTitle === group.title}
                                    onToggle={() => setOpenGroupTitle(prev => prev === group.title ? null : group.title)}
                                />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 3. Admin-only Config Section */}
                {adminMode && (
                    <SidebarGroup className="p-0">
                        <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                            Configuración
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton 
                                        asChild 
                                        tooltip="Usuarios y Roles"
                                        className="h-10 rounded-xl hover:bg-slate-100 transition-all duration-300"
                                    >
                                        <Link to="/admin/users">
                                            <Settings2 className="size-5" />
                                            <span className="font-semibold tracking-tight">Usuarios y Roles</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="border-t border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
                    <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:ml-1">
                        <div className={`h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white transition-all group-hover:scale-105 duration-300`}>
                            <span className="text-white font-black text-sm group-data-[collapsible=icon]:text-xs">{userInitial}</span>
                        </div>
                        <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                            <span className="text-sm font-bold text-slate-900 truncate leading-none mb-1.5">{userName}</span>
                            <span className="text-[9px] text-slate-400 font-black truncate uppercase tracking-[0.1em]">{user?.role?.name || 'Vendedor'}</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 group-data-[collapsible=icon]:hidden transition-all"
                        onClick={() => setShowLogoutDialog(true)}
                        title="Cerrar Sesión"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>

                {/* Visible solo cuando está colapsado para permitir logout */}
                <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setShowLogoutDialog(true)}
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
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