import { Avatar, AvatarFallback } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { Search, LogOut, LayoutDashboard, Users, Inbox, PackageCheck, Truck, ArrowLeftRight, DollarSign, Wallet, Store, Calculator, Activity, Boxes, Tag, Phone, Award, CheckCircle } from "lucide-react"
import { LogoutDialog } from "@/shared/components/LogoutDialog"
import { useState, useMemo, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/shared/auth"

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
    const { user, logout } = useAuth();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    
    const handleLogout = () => {
        logout();
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
                    className="w-full h-10 rounded-xl bg-slate-100/50 border-none pl-10 text-xs sm:text-sm md:w-[250px] lg:w-[380px] focus:ring-2 focus:ring-monchito-purple/10 transition-all font-semibold tracking-tight relative z-0"
                />

                {/* Resultados de búsqueda */}
                {isSearchOpen && results.length > 0 && (
                    <div className="absolute top-12 left-0 right-0 glass rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="p-2 space-y-1">
                            {results.map((m) => (
                                <button
                                    key={m.url}
                                    onClick={() => onSelect(m.url)}
                                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-monchito-purple/[0.03] transition-all rounded-xl group text-left"
                                >
                                    <div className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-monchito-purple group-hover:text-white transition-all duration-300">
                                        <m.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-slate-700 leading-none mb-1.5 transition-colors group-hover:text-monchito-purple">{m.title}</span>
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{m.category}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 ml-auto">
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-sm font-bold text-slate-800 leading-none mb-1">
                        {user?.username || 'Usuario'}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {user?.role?.name || 'CONECTADO'}
                    </span>
                </div>
                
                <Avatar className="h-10 w-10 ring-2 ring-slate-100 ring-offset-2 transition-transform hover:scale-105">
                    <AvatarFallback className="bg-monchito-purple/10 text-monchito-purple font-black">
                        {(user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    onClick={() => setShowLogoutDialog(true)}
                    title="Cerrar sesión"
                >
                    <LogOut className="h-5 w-5" />
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
