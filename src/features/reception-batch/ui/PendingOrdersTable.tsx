import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { Order } from "@/entities/order/model/types"
import { ArrowRight, Search, Tag } from "lucide-react"
import { getPaidAmount } from "@/entities/order/model/model"

import { Pagination } from "@/shared/ui/pagination"

interface Props {
    orders: Order[]
    onMove: (ids: string[]) => void
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    }
    currentPage?: number;
    onPageChange?: (page: number) => void;
    filters?: {
        search: string;
        receiptNumber: string;
        orderNumber: string;
        brandId: string;
        type: string;
        startDate: string;
        endDate: string;
    };
    onFiltersChange?: (filters: any) => void;
}

export function PendingOrdersTable({ orders, onMove, pagination, currentPage = 1, onPageChange, filters, onFiltersChange }: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    
    // Extract unique brands for filter dropdown
    const availableBrands = useMemo(() => {
        const map = new Map<string, string>();
        orders.forEach(o => {
            if (o.brandId && o.brandName) {
                map.set(o.brandId, o.brandName);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [orders]);

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        const allIds = orders.map(o => o.id);
        const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

        if (allSelected) {
            setSelected(prev => {
                const next = new Set(prev);
                allIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelected(prev => {
                const next = new Set(prev);
                allIds.forEach(id => next.add(id));
                return next;
            });
        }
    }

    const handleMove = () => {
        onMove(Array.from(selected))
        setSelected(new Set())
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
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            // Move to first row of table
            const firstCell = document.querySelector('tbody tr input[type="checkbox"]') as HTMLElement;
            if (firstCell) firstCell.focus();
        }
    }

    const handleFilterUpdate = (newFields: Partial<NonNullable<typeof filters>>) => {
        if (onFiltersChange && filters) {
            onFiltersChange({ ...filters, ...newFields });
            if (onPageChange) onPageChange(1);
        }
    }

    const areAllSelected = orders.length > 0 && orders.every(o => selected.has(o.id));
    const currentFilters = filters || { search: '', receiptNumber: '', orderNumber: '', brandId: '', type: '', startDate: '', endDate: '' };

    if (orders.length === 0 && !currentFilters.search && !currentFilters.receiptNumber && !currentFilters.orderNumber) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                <p>No hay pedidos pendientes de recibir.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 h-full flex flex-col pt-1">
            {/* Filters Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-3 gap-y-4 items-end">
                    {/* Search Input (Client) */}
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Empresaria</label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-monchito-purple transition-colors" />
                            <Input
                                placeholder="Nombre de empresaria..."
                                value={currentFilters.search}
                                onChange={(e) => handleFilterUpdate({ search: e.target.value })}
                                onKeyDown={(e) => handleFilterKeyDown(e, 0)}
                                data-filter-index="0"
                                tabIndex={1}
                                className="pl-10 bg-white border-slate-200 focus:ring-monchito-purple/20 h-10 text-sm font-medium rounded-xl shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Receipt Filter */}
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">N° Recibo</label>
                        <div className="relative">
                            <Input
                                placeholder="Ej: 4523..."
                                value={currentFilters.receiptNumber}
                                onChange={(e) => handleFilterUpdate({ receiptNumber: e.target.value })}
                                onKeyDown={(e) => handleFilterKeyDown(e, 1)}
                                data-filter-index="1"
                                tabIndex={2}
                                className="bg-white border-slate-200 focus:ring-monchito-purple/20 h-10 text-sm font-bold rounded-xl shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Order Number Filter */}
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">N° Pedido</label>
                        <div className="relative">
                            <Input
                                placeholder="Ej: ORD-..."
                                value={currentFilters.orderNumber}
                                onChange={(e) => handleFilterUpdate({ orderNumber: e.target.value })}
                                onKeyDown={(e) => handleFilterKeyDown(e, 2)}
                                data-filter-index="2"
                                tabIndex={3}
                                className="bg-white border-slate-200 focus:ring-monchito-purple/20 h-10 text-sm font-bold rounded-xl shadow-sm transition-all text-monchito-purple"
                            />
                        </div>
                    </div>

                    {/* Brand Select */}
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Catálogo</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <select
                                value={currentFilters.brandId}
                                onChange={(e) => handleFilterUpdate({ brandId: e.target.value })}
                                onKeyDown={(e) => handleFilterKeyDown(e, 3)}
                                data-filter-index="3"
                                tabIndex={4}
                                className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-monchito-purple/20 focus:outline-none appearance-none font-bold text-slate-700 shadow-sm transition-all"
                            >
                                <option value="">Todos los Catálogos</option>
                                <option value="ALL">Mostrar Todo</option>
                                {availableBrands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            {pagination?.total || orders.length} Resultados
                        </span>
                        {(currentFilters.search || currentFilters.receiptNumber || currentFilters.orderNumber || currentFilters.brandId) && (
                            <button
                                onClick={() => { 
                                    handleFilterUpdate({ 
                                        search: '', 
                                        receiptNumber: '', 
                                        orderNumber: '', 
                                        brandId: '', 
                                        type: '',
                                        startDate: '',
                                        endDate: '' 
                                    }); 
                                }}
                                className="text-[10px] text-slate-400 hover:text-red-500 font-bold transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                    
                    <Button
                        size="sm"
                        onClick={handleMove}
                        disabled={selected.size === 0}
                        className="bg-monchito-purple hover:bg-monchito-purple/90 text-white shadow-sm transition-all active:scale-95 h-9 text-xs px-6 rounded-xl font-black uppercase tracking-widest"
                    >
                        Continuar con ({selected.size}) <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Pagination for Pending Orders */}
            {pagination && pagination.pages > 1 && (
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={pagination.pages}
                        onPageChange={onPageChange || (() => {})}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                    />
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-80">
                <div className="flex-1 overflow-y-auto">
                    <Table className="min-w-[1000px] w-full">
                        <TableHeader>
                            <TableRow className="bg-monchito-purple/5 hover:bg-monchito-purple/5 border-b border-monchito-purple/10 h-12 sticky top-0 z-10">
                                <TableHead className="w-[30px] p-1 text-center">
                                    <input
                                        type="checkbox"
                                        checked={areAllSelected}
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
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                        No se encontraron resultados con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order, index) => {
                                    const paid = getPaidAmount(order);
                                    const isSelected = selected.has(order.id);
                                    return (
                                        <TableRow
                                            key={order.id}
                                            data-row-index={index}
                                            tabIndex={10 + index}
                                            className={`cursor-pointer transition-colors border-b border-slate-50 hover:bg-monchito-purple/5 ${isSelected ? "bg-monchito-purple/10" : ""}`}
                                            onClick={() => toggle(order.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === ' ' || e.key === 'Enter') {
                                                    e.preventDefault();
                                                    toggle(order.id);
                                                } else if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    const next = document.querySelector(`[data-row-index="${index + 1}"]`) as HTMLElement;
                                                    if (next) next.focus();
                                                } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    const prev = document.querySelector(`[data-row-index="${index - 1}"]`) as HTMLElement;
                                                    if (prev) {
                                                        prev.focus();
                                                    } else {
                                                        const lastFilter = document.querySelector('[data-filter-index="3"]') as HTMLElement;
                                                        if (lastFilter) lastFilter.focus();
                                                    }
                                                }
                                            }}
                                        >
                                            <TableCell className="p-1 w-[30px] text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggle(order.id)}
                                                    tabIndex={-1}
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
                <div className="bg-slate-50 border-t p-2 flex items-center justify-between px-6 shrink-0 overflow-x-auto min-h-[50px]">
                    <div className="flex-1">
                        {pagination && pagination.pages > 1 && onPageChange && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={pagination.pages}
                                onPageChange={onPageChange}
                                totalItems={pagination.total}
                                itemsPerPage={pagination.limit}
                            />
                        )}
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Total Pedidos:</span>
                            <span className="font-mono font-bold text-slate-800">${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
