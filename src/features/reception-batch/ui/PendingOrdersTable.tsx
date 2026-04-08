import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { Order } from "@/entities/order/model/types"
import { ArrowRight, Search, Tag } from "lucide-react"
import { getPaidAmount } from "@/entities/order/model/model"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"

interface Props {
    orders: Order[]
    onMove: (ids: string[]) => void
}

export function PendingOrdersTable({ orders, onMove }: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState("")
    const [receiptFilter, setReceiptFilter] = useState("")
    const [orderNumberFilter, setOrderNumberFilter] = useState("")
    const [brandFilter, setBrandFilter] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    // Map for faster lookups


    // Extract unique brands for filter dropdown
    const availableBrands = useMemo(() => {
        const set = new Set<string>();
        orders.forEach(o => o.brandName && set.add(o.brandName));
        return Array.from(set).sort();
    }, [orders]);

    const filteredOrders = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase().trim();
        const lowerReceipt = receiptFilter.toLowerCase().trim();
        const lowerOrderNum = orderNumberFilter.toLowerCase().trim();
        const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : null;
        const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : null;

        return orders.filter(o => {
            // 1. Client Search
            if (lowerSearch && !o.clientName.toLowerCase().includes(lowerSearch)) return false;

            // 2. Receipt Search
            if (lowerReceipt && !o.receiptNumber.toLowerCase().includes(lowerReceipt)) return false;

            // 3. Order Number Search
            if (lowerOrderNum && !(o.orderNumber || "").toLowerCase().includes(lowerOrderNum)) return false;

            // 4. Brand Filter
            if (brandFilter && o.brandName !== brandFilter) return false;

            // 5. Type Filter
            if (typeFilter && o.type !== typeFilter) return false;

            // 6. Date Range Filter
            if (startDate || endDate) {
                const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
                if (startDate && orderDate < startDate) return false;
                if (endDate && orderDate > endDate) return false;
            }

            return true;
        });
    }, [orders, searchTerm, receiptFilter, orderNumberFilter, brandFilter, typeFilter, dateRange]);

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        const allFilteredIds = filteredOrders.map(o => o.id);
        const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));

        if (allSelected) {
            setSelected(prev => {
                const next = new Set(prev);
                allFilteredIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelected(prev => {
                const next = new Set(prev);
                allFilteredIds.forEach(id => next.add(id));
                return next;
            });
        }
    }

    const handleMove = () => {
        onMove(Array.from(selected))
        setSelected(new Set())
        // Reset filters? Maybe keep them.
        // Let's keep filters as user might move in batches from same search.
    }

    const handleFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, fieldIndex: number) => {
        const input = e.currentTarget as HTMLInputElement;
        let selectionStart: number | null = null;
        try {
            selectionStart = input.selectionStart;
        } catch (e) {}

        const valueLength = (input.value || "").length;
        const isTextInput = input.tagName === 'INPUT' && (input.type === 'text' || !input.type);

        if (e.key === 'ArrowLeft') {
            const shouldMove = !isTextInput || selectionStart === 0;
            if (shouldMove) {
                const nextTarget = document.querySelector(`[data-filter-index="${fieldIndex - 1}"]`) as HTMLElement;
                if (nextTarget) {
                    e.preventDefault();
                    nextTarget.focus();
                    if (nextTarget instanceof HTMLInputElement) nextTarget.select();
                }
            }
        } else if (e.key === 'ArrowRight') {
            const shouldMove = !isTextInput || selectionStart === valueLength;
            if (shouldMove) {
                const nextTarget = document.querySelector(`[data-filter-index="${fieldIndex + 1}"]`) as HTMLElement;
                if (nextTarget) {
                    e.preventDefault();
                    nextTarget.focus();
                    if (nextTarget instanceof HTMLInputElement) nextTarget.select();
                }
            }
        }
    }

    const areAllFilteredSelected = filteredOrders.length > 0 && filteredOrders.every(o => selected.has(o.id));

    if (orders.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                <p>No hay pedidos pendientes de recibir.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Filters Section */}
            <div className="bg-monchito-purple/5 p-3 rounded-lg border border-monchito-purple/10 shrink-0">
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-1 gap-2 items-center w-full">
                        {/* Search Input (Client) */}
                        <div className="relative col-span-2 sm:col-span-1 lg:flex-1 min-w-[150px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-monchito-purple/50" />
                            <Input
                                placeholder="Empresaria..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => handleFilterKeyDown(e, 0)}
                                data-filter-index="0"
                                className="pl-8 bg-white border-monchito-purple/20 focus-visible:ring-monchito-purple/20 h-9 text-xs font-normal"
                            />
                        </div>

                        {/* Receipt Filter */}
                        <div className="relative lg:flex-1 min-w-[100px]">
                            <Input
                                placeholder="N° Recibo..."
                                value={receiptFilter}
                                onChange={(e) => setReceiptFilter(e.target.value)}
                                onKeyDown={(e) => handleFilterKeyDown(e, 1)}
                                data-filter-index="1"
                                className="bg-white border-monchito-purple/20 focus-visible:ring-monchito-purple/20 h-9 text-xs px-3 font-normal"
                            />
                        </div>

                        {/* Order Number Filter */}
                        <div className="relative lg:flex-1 min-w-[100px]">
                            <Input
                                placeholder="N° Pedido..."
                                value={orderNumberFilter}
                                onChange={(e) => setOrderNumberFilter(e.target.value)}
                                onKeyDown={(e) => handleFilterKeyDown(e, 2)}
                                data-filter-index="2"
                                className="bg-white border-monchito-purple/20 focus-visible:ring-monchito-purple/20 h-9 text-xs px-3 font-normal"
                            />
                        </div>

                        {/* Brand Select */}
                        <div className="relative lg:flex-1 min-w-[130px]">
                            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-monchito-purple/50" />
                            <select
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                                onKeyDown={(e) => handleFilterKeyDown(e, 3)}
                                data-filter-index="3"
                                className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-monchito-purple/20 rounded-lg focus:border-monchito-purple focus:outline-none appearance-none font-normal"
                            >
                                <option value="">Todos Catálogos</option>
                                {availableBrands.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="relative lg:flex-1 min-w-[90px]">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                onKeyDown={(e) => handleFilterKeyDown(e, 4)}
                                data-filter-index="4"
                                className="w-full h-9 px-3 text-xs bg-white border border-monchito-purple/20 rounded-lg focus:border-monchito-purple focus:outline-none appearance-none font-normal"
                            >
                                <option value="">Toda Clase</option>
                                <option value="NORMAL">Normal</option>
                                <option value="CAMBIO">Cambio</option>
                                <option value="PREVENTA">Preventa</option>
                                <option value="REPROGRAMACION">Repro</option>
                                <option value="CATALOGO">Catálogo</option>
                            </select>
                        </div>

                        {/* Date Range Picker */}
                        <div className="relative col-span-2 sm:col-span-1 lg:flex-1 min-w-[150px]">
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                showLabel={false}
                                placeholder="dd/mm/aaaa"
                                className="h-9 text-xs font-normal"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-monchito-purple/5 pt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-monchito-purple bg-monchito-purple/10 px-2 py-1 rounded-md">
                                {filteredOrders.length} Resultados
                            </span>
                            {(searchTerm || receiptFilter || orderNumberFilter || brandFilter || typeFilter || dateRange) && (
                                <button
                                    onClick={() => { 
                                        setSearchTerm(''); 
                                        setReceiptFilter(''); 
                                        setOrderNumberFilter(''); 
                                        setBrandFilter(''); 
                                        setTypeFilter('');
                                        setDateRange(undefined); 
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-red-500 underline"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                        
                        <Button
                            size="sm"
                            onClick={handleMove}
                            disabled={selected.size === 0}
                            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white shadow-sm transition-all active:scale-95 h-8 text-xs px-4"
                        >
                            Mover Seleccionados ({selected.size}) <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-80">
                <div className="flex-1 overflow-y-auto">
                    <Table className="min-w-[1000px] w-full">
                        <TableHeader>
                            <TableRow className="bg-monchito-purple/5 hover:bg-monchito-purple/5 border-b border-monchito-purple/10 h-12 sticky top-0 z-10">
                                <TableHead className="w-[30px] p-1 text-center">
                                    <input
                                        type="checkbox"
                                        checked={areAllFilteredSelected}
                                        onChange={toggleAll}
                                        className="accent-monchito-purple h-3 w-3 cursor-pointer rounded"
                                    />
                                </TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Recibo</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Empresaria</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">N° de Pedido</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Tipo</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Catálogo</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Estado</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Valor Pedido</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Abono</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center whitespace-nowrap">Fecha Posible Entrega</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                        No se encontraron resultados con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map(order => {
                                    const paid = getPaidAmount(order);
                                    return (
                                        <TableRow
                                            key={order.id}
                                            className={`cursor-pointer transition-colors border-b border-slate-50 hover:bg-monchito-purple/5 ${selected.has(order.id) ? "bg-monchito-purple/10" : ""}`}
                                            onClick={() => toggle(order.id)}
                                        >
                                            <TableCell className="p-1 w-[30px] text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(order.id)}
                                                    onChange={() => toggle(order.id)}
                                                    className="accent-monchito-purple h-3 w-3 cursor-pointer rounded"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2 px-2 font-mono text-xs font-medium text-center">
                                                {order.type === 'CAMBIO' ? order.orderNumber : `#${order.receiptNumber}`}
                                            </TableCell>
                                            <TableCell className="py-2 px-2 text-xs font-bold text-center">{order.clientName}</TableCell>
                                            <TableCell className="py-2 px-2 text-xs font-medium text-center">
                                                {order.type === 'CAMBIO' ? (order.sourceOrderNumber || '---') : (order.orderNumber || '---')}
                                            </TableCell>
                                            <TableCell className="py-2 px-2 text-[10px] text-center">
                                                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                                                    order.type === 'CAMBIO' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                    order.type === 'REPROGRAMACION' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                    order.type === 'PREVENTA' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    order.type === 'CATALOGO' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                    'bg-blue-100 text-blue-700 border-blue-200'
                                                }`}>
                                                    {order.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-2 text-xs font-medium text-center">{order.brandName}</TableCell>
                                            <TableCell className="py-2 px-2 text-center">
                                                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                                                    order.status === 'EN_TRANSITO'
                                                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                                                        : order.status === 'POR_RECIBIR'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                    {order.status === 'EN_TRANSITO' ? 'En Tránsito' : 
                                                     order.status === 'POR_RECIBIR' ? 'Por Recibir' : 'Recolectado'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-2 text-center font-mono text-xs font-bold">${order.total.toFixed(2)}</TableCell>
                                            <TableCell className="py-2 px-2 text-center font-mono text-xs font-bold text-emerald-600">${paid.toFixed(2)}</TableCell>
                                            <TableCell className="py-2 px-2 text-xs text-muted-foreground italic text-center">
                                                {order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toLocaleDateString() : '---'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Summary Footer */}
                <div className="bg-slate-50 border-t p-2 flex justify-end gap-8 pr-12 shrink-0 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Total Pedidos:</span>
                        <span className="font-mono font-bold text-slate-800">${filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
