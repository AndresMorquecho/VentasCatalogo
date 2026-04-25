import { Search, Filter, Tag, ReceiptText, User, ShoppingBag } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { DateRangePicker } from "@/shared/ui/filters";
import type { DateRange } from "react-day-picker";

interface Props {
    search: string;
    onSearchChange: (val: string) => void;
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
    // New SI/NO filters
    deliveredFilter: string;
    onDeliveredChange: (val: string) => void;
    receivedFilter: string;
    onReceivedChange: (val: string) => void;
    orderType: string;
    onOrderTypeChange: (val: string) => void;
    onClear: () => void;
}

export function InventoryFilters({
    search, onSearchChange,
    brandFilter, onBrandChange,
    brands,
    dateRange, onDateRangeChange,
    receiptNumber, onReceiptNumberChange,
    orderNumber, onOrderNumberChange,
    deliveredFilter, onDeliveredChange,
    receivedFilter, onReceivedChange,
    orderType, onOrderTypeChange,
    onClear
}: Props) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                Filtros de Búsqueda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                {/* Row 1: Catalogo, Fechas */}
                <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Tag className="h-3 w-3" /> Catálogo
                    </label>
                    <select
                        value={brandFilter}
                        onChange={(e) => onBrandChange(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple transition-all font-bold text-slate-700 outline-none"
                    >
                        <option value="">TODAS LAS MARCAS</option>
                        {brands.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-9 space-y-1.5">
                    <DateRangePicker
                        value={dateRange}
                        onChange={onDateRangeChange}
                        label="Rango de Fechas"
                        placeholder="Seleccionar periodo"
                        className="h-10 border-slate-200"
                    />
                </div>

                {/* Row 2: No Recibo, Empresaria, No Pedido */}
                <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <ReceiptText className="h-3 w-3" /> No. de Recibo
                    </label>
                    <Input
                        placeholder="Ej: 1041..."
                        value={receiptNumber}
                        onChange={(e) => onReceiptNumberChange(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 font-bold text-sm bg-white shadow-sm focus-visible:ring-monchito-purple/20 focus-visible:border-monchito-purple"
                    />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <User className="h-3 w-3" /> Empresaria / Cliente
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre, Cédula..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 rounded-xl border-slate-200 h-10 font-bold text-sm bg-white shadow-sm focus-visible:ring-monchito-purple/20 focus-visible:border-monchito-purple"
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
                        className="rounded-xl border-slate-200 h-10 font-bold text-sm bg-white shadow-sm focus-visible:ring-monchito-purple/20 focus-visible:border-monchito-purple"
                    />
                </div>

                {/* Row 3: Entregado, Recibido, BTN */}
                <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Filter className="h-3 w-3" /> Entregado
                    </label>
                    <select
                        value={deliveredFilter}
                        onChange={(e) => onDeliveredChange(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple transition-all font-bold text-slate-700 outline-none"
                    >
                        <option value="ALL">TODOS</option>
                        <option value="SI">SÍ ENTREGADO</option>
                        <option value="NO">NO ENTREGADO</option>
                    </select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Filter className="h-3 w-3" /> Recibido
                    </label>
                    <select
                        value={receivedFilter}
                        onChange={(e) => onReceivedChange(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple transition-all font-bold text-slate-700 outline-none"
                    >
                        <option value="ALL">TODOS</option>
                        <option value="SI">SÍ RECIBIDO</option>
                        <option value="NO">NO RECIBIDO</option>
                    </select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <Tag className="h-3 w-3" /> Tipo de Pedido
                    </label>
                    <select
                        value={orderType}
                        onChange={(e) => onOrderTypeChange(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple transition-all font-bold text-slate-700 outline-none"
                    >
                        <option value="all">CUALQUIER TIPO</option>
                        <option value="NORMAL">NORMAL</option>
                        <option value="CAMBIO">CAMBIO</option>
                        <option value="REPROGRAMACION">REPRO</option>
                        <option value="PREVENTA">PREVENTA</option>
                    </select>
                </div>

                <div className="md:col-span-3 flex items-end">
                    <Button 
                        onClick={onClear}
                        variant="outline"
                        className="w-full h-10 rounded-xl border-slate-200 text-slate-500 hover:text-monchito-purple hover:border-monchito-purple/30 font-bold text-xs uppercase tracking-widest transition-all bg-white shadow-sm"
                    >
                        Limpiar Filtros
                    </Button>
                </div>
            </div>
        </div>
    );
}
