import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { Order } from "@/entities/order/model/types"
import { ArrowRight, Search, Tag } from "lucide-react"

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
    const [dateFilter, setDateFilter] = useState("") // YYYY-MM-DD from input type="date"

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
        const targetDate = dateFilter ? new Date(dateFilter).toISOString().split('T')[0] : null;

        return orders.filter(o => {
            // 1. Client Search
            if (lowerSearch && !o.clientName.toLowerCase().includes(lowerSearch)) return false;

            // 2. Receipt Search
            if (lowerReceipt && !o.receiptNumber.toLowerCase().includes(lowerReceipt)) return false;

            // 3. Order Number Search
            if (lowerOrderNum && !(o.orderNumber || "").toLowerCase().includes(lowerOrderNum)) return false;

            // 4. Brand Filter
            if (brandFilter && o.brandName !== brandFilter) return false;

            // 5. Date Filter
            if (targetDate) {
                const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
                if (orderDate !== targetDate) return false;
            }

            return true;
        });
    }, [orders, searchTerm, receiptFilter, orderNumberFilter, brandFilter, dateFilter]);

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
            <div className="bg-amber-50/50 p-1.5 rounded-lg border border-amber-100 shrink-0">
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                    <div className="flex flex-1 gap-2 items-center w-full">
                        {/* Search Input (Client) */}
                        <div className="relative w-44">
                            <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-amber-600/50" />
                            <Input
                                placeholder="Empresaria..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-7 bg-white border-amber-200 focus-visible:ring-amber-500 h-7 text-[10px]"
                            />
                        </div>

                        {/* Receipt Filter */}
                        <div className="relative w-32">
                            <Input
                                placeholder="N° Recibo..."
                                value={receiptFilter}
                                onChange={(e) => setReceiptFilter(e.target.value)}
                                className="bg-white border-amber-200 focus-visible:ring-amber-500 h-7 text-[10px] px-2"
                            />
                        </div>

                        {/* Order Number Filter */}
                        <div className="relative w-32">
                            <Input
                                placeholder="N° Pedido..."
                                value={orderNumberFilter}
                                onChange={(e) => setOrderNumberFilter(e.target.value)}
                                className="bg-white border-amber-200 focus-visible:ring-amber-500 h-7 text-[10px] px-2"
                            />
                        </div>

                        {/* Brand Select */}
                        <div className="relative w-36">
                            <Tag className="absolute left-2 top-1.5 h-3.5 w-3.5 text-amber-600/50" />
                            <select
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                                className="w-full h-7 pl-7 pr-3 text-[10px] bg-white border border-amber-200 rounded-md focus:border-amber-500 focus:outline-none appearance-none font-medium"
                            >
                                <option value="">Todos Catálogos</option>
                                {availableBrands.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Input */}
                        <div className="relative w-32">
                            <Input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="h-7 w-full bg-white border-amber-200 focus-visible:ring-amber-500 text-[10px] px-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                            {filteredOrders.length}
                        </span>
                        {(searchTerm || receiptFilter || orderNumberFilter || brandFilter || dateFilter) && (
                            <button
                                onClick={() => { 
                                    setSearchTerm(''); 
                                    setReceiptFilter(''); 
                                    setOrderNumberFilter(''); 
                                    setBrandFilter(''); 
                                    setDateFilter(''); 
                                }}
                                className="text-[10px] text-slate-400 hover:text-red-500 underline"
                            >
                                Limpiar
                            </button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleMove}
                            disabled={selected.size === 0}
                            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all active:scale-95 h-7 text-xs px-3 ml-2"
                        >
                            Mover ({selected.size}) <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md overflow-hidden flex-1 flex flex-col bg-white shadow-sm ring-1 ring-amber-100/50">
                <div className="flex-1 overflow-y-auto">
                    <Table className="min-w-[1000px] w-full">
                        <TableHeader className="bg-amber-50/80 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="h-8">
                                <TableHead className="w-[30px] p-1 text-center">
                                    <input
                                        type="checkbox"
                                        checked={areAllFilteredSelected}
                                        onChange={toggleAll}
                                        className="accent-amber-600 h-3 w-3 cursor-pointer rounded"
                                    />
                                </TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Recibo</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Empresaria</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">N° de Pedido</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Tipo</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Catálogo</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal text-right">Valor Pedido</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal text-right">Abono</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Fecha Posible Entrega</TableHead>
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
                                    const paid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
                                    return (
                                        <TableRow
                                            key={order.id}
                                            className={`cursor-pointer transition-colors h-10 ${selected.has(order.id) ? "bg-amber-50" : "hover:bg-slate-50"}`}
                                            onClick={() => toggle(order.id)}
                                        >
                                            <TableCell className="p-1 w-[30px] text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(order.id)}
                                                    onChange={() => toggle(order.id)}
                                                    className="accent-amber-600 h-3 w-3 cursor-pointer rounded"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                            <TableCell className="py-1 px-2 font-mono text-xs">#{order.receiptNumber}</TableCell>
                                            <TableCell className="py-1 px-2 text-xs font-medium">{order.clientName}</TableCell>
                                            <TableCell className="py-1 px-2 text-xs">{order.orderNumber || '---'}</TableCell>
                                            <TableCell className="py-1 px-2 text-[10px]">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold uppercase">{order.type}</span>
                                            </TableCell>
                                            <TableCell className="py-1 px-2 text-xs">{order.brandName}</TableCell>
                                            <TableCell className="py-1 px-2 text-right font-mono text-xs font-bold">${order.total.toFixed(2)}</TableCell>
                                            <TableCell className="py-1 px-2 text-right font-mono text-xs text-emerald-600">${paid.toFixed(2)}</TableCell>
                                            <TableCell className="py-1 px-2 text-xs text-muted-foreground italic">
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
