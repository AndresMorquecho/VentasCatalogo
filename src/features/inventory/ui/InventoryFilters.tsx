import { Search, Filter, MapPin, Tag, ReceiptText, User, ShoppingBag } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { DateRangePicker } from "@/shared/ui/filters";
import type { DateRange } from "react-day-picker";

interface Props {
    search: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    brandFilter: string;
    onBrandChange: (val: string) => void;
    brands: string[];
    // Date Range Filter
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    receiptNumber: string;
    onReceiptNumberChange: (val: string) => void;
    orderNumber: string;
    onOrderNumberChange: (val: string) => void;
    onClear: () => void;
}

export function InventoryFilters({
    search, onSearchChange,
    statusFilter, onStatusChange,
    brandFilter, onBrandChange,
    brands,
    dateRange, onDateRangeChange,
    receiptNumber, onReceiptNumberChange,
    orderNumber, onOrderNumberChange,
    onClear
}: Props) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                Filtros de Búsqueda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                {/* Row 1: Sucursal, Estado, Catalogo, Fechas */}
                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <MapPin className="h-3 w-3" /> Sucursal
                    </label>
                    <select className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-slate-700">
                        <option value="MATRIZ">MATRIZ</option>
                    </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Filter className="h-3 w-3" /> Estado
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-slate-700"
                    >
                        <option value="ALL">TODOS</option>
                        <option value="ENTRY">EN BODEGA</option>
                        <option value="DELIVERED">ENTREGADO</option>
                        <option value="RETURNED">DEVUELTO</option>
                    </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Tag className="h-3 w-3" /> Catálogo
                    </label>
                    <select
                        value={brandFilter}
                        onChange={(e) => onBrandChange(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-slate-700"
                    >
                        <option value="">TODAS</option>
                        {brands.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                    <DateRangePicker
                        value={dateRange}
                        onChange={onDateRangeChange}
                        label="Rango de Fechas"
                        placeholder="Seleccionar periodo"
                        className="h-10"
                    />
                </div>

                {/* Row 2: No Recibo, Empresaria, No Pedido, BTN */}
                <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <ReceiptText className="h-3 w-3" /> No. de Recibo
                    </label>
                    <Input
                        placeholder="Ej: 104173..."
                        value={receiptNumber}
                        onChange={(e) => onReceiptNumberChange(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 font-bold text-sm bg-white shadow-sm focus-visible:ring-emerald-500/20"
                    />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <User className="h-3 w-3" /> Empresaria / Cliente
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre, Cédula..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 rounded-xl border-slate-200 h-10 font-bold text-sm bg-white shadow-sm focus-visible:ring-emerald-500/20"
                        />
                    </div>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <ShoppingBag className="h-3 w-3" /> No. de Pedido
                    </label>
                    <Input
                        placeholder="Ej: G280..."
                        value={orderNumber}
                        onChange={(e) => onOrderNumberChange(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 font-bold text-sm bg-white shadow-sm focus-visible:ring-emerald-500/20"
                    />
                </div>

                <div className="md:col-span-2 flex items-end">
                    <Button 
                        onClick={onClear}
                        variant="outline"
                        className="w-full h-10 rounded-xl border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-100 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Limpiar
                    </Button>
                </div>
            </div>
        </div>
    );
}
