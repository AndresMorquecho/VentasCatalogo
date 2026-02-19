import { Search, Filter, CalendarDays } from "lucide-react";
import { Input } from "@/shared/ui/input";

interface Props {
    search: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    brandFilter: string;
    onBrandChange: (val: string) => void;
    brands: string[];
}

export function InventoryFilters({
    search, onSearchChange,
    statusFilter, onStatusChange,
    brandFilter, onBrandChange,
    brands
}: Props) {
    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search */}
                <div className="md:col-span-4 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar Cliente, Pedido..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Status Filter */}
                <div className="md:col-span-3 relative">
                    <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="ENTRY">⬇️ En Bodega</option>
                        <option value="DELIVERED">⬆️ Entregado</option>
                        <option value="RETURNED">↩️ Devuelto</option>
                    </select>
                </div>

                {/* Brand Filter */}
                <div className="md:col-span-3 relative">
                    <select
                        value={brandFilter}
                        onChange={(e) => onBrandChange(e.target.value)}
                        className="w-full h-10 pl-3 pr-4 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="">Todas las Marcas</option>
                        {brands.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                {/* Long Storage Filter Toggle (Placeholder for now) */}
                <div className="md:col-span-2 flex items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays className="h-4 w-4" />
                        <span>Filtros Avanzados</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
