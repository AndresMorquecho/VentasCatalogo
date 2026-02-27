import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { Order } from "@/entities/order/model/types"
import type { Client } from "@/entities/client/model/types"
import { ArrowRight, Search, Calendar, Tag, User, Receipt } from "lucide-react"

interface Props {
    orders: Order[]
    clients?: Client[]
    onMove: (ids: string[]) => void
}

export function PendingOrdersTable({ orders, clients = [], onMove }: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState("")
    const [brandFilter, setBrandFilter] = useState("")
    const [dateFilter, setDateFilter] = useState("") // YYYY-MM-DD from input type="date"

    // Map for faster lookups
    const clientMap = useMemo(() => {
        const map = new Map<string, Client>();
        clients.forEach(c => map.set(c.id, c));
        return map;
    }, [clients]);

    // Extract unique brands for filter dropdown
    const availableBrands = useMemo(() => {
        const set = new Set<string>();
        orders.forEach(o => o.brandName && set.add(o.brandName));
        return Array.from(set).sort();
    }, [orders]);

    const filteredOrders = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase().trim();
        const targetDate = dateFilter ? new Date(dateFilter).toISOString().split('T')[0] : null;

        return orders.filter(o => {
            // 1. Text Search (Client, Receipt, etc)
            let matchesSearch = true;
            if (lowerSearch) {
                const client = clientMap.get(o.clientId);
                const identification = client?.identificationNumber?.toLowerCase() || "";

                matchesSearch = (
                    o.clientName.toLowerCase().includes(lowerSearch) ||
                    o.receiptNumber.toLowerCase().includes(lowerSearch) ||
                    identification.includes(lowerSearch)
                );
            }

            // 2. Brand Filter
            let matchesBrand = true;
            if (brandFilter) {
                matchesBrand = o.brandName === brandFilter;
            }

            // 3. Date Filter
            let matchesDate = true;
            if (targetDate) {
                // Determine creation date YYYY-MM-DD
                const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
                matchesDate = orderDate === targetDate;
            }

            return matchesSearch && matchesBrand && matchesDate;
        });
    }, [orders, searchTerm, brandFilter, dateFilter, clientMap]);

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
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-amber-600/50" />
                            <Input
                                placeholder="Cliente, Cédula, Recibo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-7 bg-white border-amber-200 focus-visible:ring-amber-500 h-7 text-xs"
                            />
                        </div>

                        {/* Brand Select */}
                        <div className="relative w-40">
                            <Tag className="absolute left-2 top-1.5 h-3.5 w-3.5 text-amber-600/50" />
                            <select
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                                className="w-full h-7 pl-7 pr-3 text-xs bg-white border border-amber-200 rounded-md focus:border-amber-500 focus:outline-none appearance-none"
                            >
                                <option value="">Todas las Marcas</option>
                                {availableBrands.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Input */}
                        <div className="relative w-36">
                            <Input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="h-7 w-full bg-white border-amber-200 focus-visible:ring-amber-500 text-xs px-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                            {filteredOrders.length}
                        </span>
                        {(searchTerm || brandFilter || dateFilter) && (
                            <button
                                onClick={() => { setSearchTerm(''); setBrandFilter(''); setDateFilter(''); }}
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
            <div className="border rounded-md overflow-hidden flex-1 overflow-y-auto bg-white shadow-sm ring-1 ring-amber-100/50">
                <Table>
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
                            <TableHead className="py-1 px-2 whitespace-nowrap text-xs sm:text-sm text-muted-foreground font-normal">Datos Cliente</TableHead>
                            <TableHead className="py-1 px-2 whitespace-nowrap text-xs sm:text-sm text-muted-foreground font-normal">Detalles</TableHead>
                            <TableHead className="text-right py-1 px-2 whitespace-nowrap text-xs sm:text-sm text-muted-foreground font-normal">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    No se encontraron resultados con los filtros aplicados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map(order => (
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
                                    <TableCell className="py-1 px-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground text-xs sm:text-sm flex items-center gap-1">
                                                <User className="w-3 w-3 sm:w-4 sm:h-4 text-muted-foreground" /> {order.clientName}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground font-normal pl-4 sm:pl-5 leading-tight">{order.brandName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-1 px-2">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs sm:text-sm bg-slate-100 px-1 rounded w-fit text-foreground flex items-center gap-1">
                                                <Receipt className="w-3 w-3 sm:w-4 sm:h-4 text-muted-foreground" /> #{order.receiptNumber}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground font-normal mt-0.5 flex items-center gap-1 pl-1">
                                                <Calendar className="w-3 h-3 text-muted-foreground" /> {new Date(order.createdAt).toLocaleDateString('es-EC')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium text-foreground py-1 px-2 text-xs sm:text-sm">
                                        ${order.total.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
