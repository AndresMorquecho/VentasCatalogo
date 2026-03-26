import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { Search, LogOut, LayoutDashboard, Users, Inbox, PackageCheck, Truck, ArrowLeftRight, DollarSign, Wallet, Store, Calculator, Activity, Boxes, Tag, Phone, Award, CheckCircle } from "lucide-react"
import { authService } from "@/shared/services/authService"
import { LogoutDialog } from "@/shared/components/LogoutDialog"
import { useState, useMemo, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const SEARCHABLE_MODULES = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, category: "Principal" },
    { title: "Empresarias", url: "/clients", icon: Users, category: "Comercial" },
    { title: "Pedidos", url: "/orders", icon: Inbox, category: "Comercial" },
    { title: "Recepción", url: "/orders/reception", icon: PackageCheck, category: "Logística" },
    { title: "Entregas", url: "/orders/delivery", icon: Truck, category: "Logística" },
    { title: "Cambios", url: "/exchanges", icon: ArrowLeftRight, category: "Logística" },
    { title: "Transacciones", url: "/transactions", icon: DollarSign, category: "Finanzas" },
    { title: "Abonos de Cartera", url: "/payments", icon: DollarSign, category: "Finanzas" },
    { title: "Billetera Virtual", url: "/wallet", icon: Wallet, category: "Finanzas" },
    { title: "Validación de Pagos", url: "/wallet-validations", icon: CheckCircle, category: "Finanzas" },
    { title: "Cuentas Bancarias", url: "/bank-accounts", icon: Store, category: "Finanzas" },
    { title: "Cierre de Caja", url: "/cash-closure", icon: Calculator, category: "Finanzas" },
    { title: "Análisis de Cartera", url: "/cartera", icon: Activity, category: "Finanzas" },
    { title: "Inventario", url: "/inventory", icon: Boxes, category: "Almacén" },
    { title: "Marcas", url: "/brands", icon: Tag, category: "Almacén" },
    { title: "Catálogos", url: "/catalogs", icon: Inbox, category: "Almacén" },
    { title: "Llamadas / Gestión", url: "/calls", icon: Phone, category: "Seguimiento" },
    { title: "Recompensas", url: "/rewards", icon: Award, category: "Lealtad" },
];

export function Header() {
    const navigate = useNavigate();
    const user = authService.getUser();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    
    const handleLogout = () => {
        authService.logout();
    };

    const normalize = (str: string) => 
        str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

    const results = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = normalize(searchQuery);
        return SEARCHABLE_MODULES.filter(m => 
            normalize(m.title).includes(q) || 
            normalize(m.category).includes(q)
        ).slice(0, 8);
    }, [searchQuery]);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onSelect = (url: string) => {
        navigate(url);
        setSearchQuery("");
        setIsSearchOpen(false);
    };

    return (
        <div className="flex flex-1 items-center gap-2 sm:gap-4 overflow-visible">
            <div ref={searchRef} className="relative flex-1 md:grow-0 md:hidden overflow-visible">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground z-10" />
                <input
                    type="search"
                    placeholder="Buscar módulo..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    className="w-full h-9 rounded-lg bg-slate-50 border-none pl-8 text-xs sm:text-sm md:w-[200px] lg:w-[320px] focus:ring-1 focus:ring-monchito-purple/20 relative z-0"
                />

                {/* Resultados de búsqueda */}
                {isSearchOpen && results.length > 0 && (
                    <div className="absolute top-11 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-1">
                            {results.map((m) => (
                                <button
                                    key={m.url}
                                    onClick={() => onSelect(m.url)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors rounded-lg group text-left"
                                >
                                    <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-monchito-purple/10 group-hover:text-monchito-purple transition-colors">
                                        <m.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-slate-700 leading-none mb-1">{m.title}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{m.category}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline truncate max-w-[120px] lg:max-w-none">
                    {user?.name || user?.email}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" alt={user?.name} />
                        <AvatarFallback>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0"
                    onClick={() => setShowLogoutDialog(true)}
                    title="Cerrar sesión"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
            
            <LogoutDialog 
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                onConfirm={handleLogout}
            />
        </div>
    )
}
