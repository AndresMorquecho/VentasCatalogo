import React, { useState, useMemo } from "react"
import { Search, RotateCcw, Edit, Trash2, AlertCircle, Filter } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { orderApi } from "@/entities/order/model/api"
import { useToast } from "@/shared/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getPendingAmount } from "@/entities/order/model/model"
import type { Client } from "@/entities/client/model/types"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select"
import { useBrandList } from "@/features/brands/api/hooks"

interface Props {
    batches: any[]
    clients: Client[]
    onEdit: (batch: any) => void
    onDelete: (batchId: string) => void
    isDeleting?: boolean
}

export function ReceptionHistory({ batches, onEdit, onDelete, isDeleting }: Props) {
    const [searchTerm, setSearchTerm] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [clientFilter, setClientFilter] = useState("")
    const [brandId, setBrandId] = useState("ALL")
    const [packingFilter, setPackingFilter] = useState("")
    const [receiptFilter, setReceiptFilter] = useState("")
    
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    const { showToast } = useToast()
    const queryClient = useQueryClient()

    // Real brands from database
    const { data: brandsData } = useBrandList({ limit: 100 });
    const brands = brandsData?.data || [];

    // 1. Filter Logic
    const filteredBatches = useMemo(() => {
        return batches.filter(b => {
            // Date Range Filter
            if (startDate || endDate) {
                const bDate = new Date(b.receptionDate);
                if (startDate) {
                    const startArr = startDate.split('-').map(Number);
                    const start = new Date(startArr[0], startArr[1] - 1, startArr[2], 0, 0, 0);
                    if (bDate < start) return false;
                }
                if (endDate) {
                    const endArr = endDate.split('-').map(Number);
                    const end = new Date(endArr[0], endArr[1] - 1, endArr[2], 23, 59, 59, 999);
                    if (bDate > end) return false;
                }
            }

            // Client Filter
            if (clientFilter && clientFilter.trim() !== "") {
                const lowerClient = clientFilter.toLowerCase();
                const hasClient = b.orders?.some((o: any) => 
                    o.clientName?.toLowerCase().includes(lowerClient)
                );
                if (!hasClient) return false;
            }

            // Brand Filter
            if (brandId !== "ALL") {
                const hasBrand = b.orders?.some((o: any) => o.brandId === brandId);
                if (!hasBrand) return false;
            }

            // Packing Number Filter
            if (packingFilter && packingFilter.trim() !== "") {
                if (!b.packingNumber?.toLowerCase().includes(packingFilter.toLowerCase())) return false;
            }

            // Receipt Number Filter
            if (receiptFilter && receiptFilter.trim() !== "") {
                const hasReceipt = b.orders?.some((o: any) => 
                    o.receiptNumber?.toLowerCase().includes(receiptFilter.toLowerCase())
                );
                if (!hasReceipt) return false;
            }

            // General Search
            if (searchTerm && searchTerm.trim() !== "") {
                const lowerSearch = searchTerm.toLowerCase();
                const matchesPacking = b.packingNumber?.toLowerCase().includes(lowerSearch);
                const matchesOrders = (b.orders || []).some((o: any) => 
                    o.clientName?.toLowerCase().includes(lowerSearch) ||
                    o.receiptNumber?.toLowerCase().includes(lowerSearch) ||
                    o.brandName?.toLowerCase().includes(lowerSearch)
                );
                if (!matchesPacking && !matchesOrders) return false;
            }

            return true;
        });
    }, [batches, startDate, endDate, clientFilter, brandId, packingFilter, receiptFilter, searchTerm]);

    const handleReverseIndividual = async (orderId: string) => {
        setIsProcessing(orderId)
        try {
            await orderApi.reverseReception(orderId)
            showToast("La recepción ha sido revertida correctamente.", "success")
            await queryClient.invalidateQueries({ queryKey: ['orders'] })
            await queryClient.invalidateQueries({ queryKey: ['reception-batches'] });
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al revertir recepción", "error")
        } finally {
            setIsProcessing(null)
        }
    }

    const totalGrandReception = filteredBatches.reduce((sum, b) => sum + Number(b.packingTotal || 0), 0);

    const checkCanModify = (batch: any) => {
        return !batch.orders?.some((o: any) => o.status === 'ENTREGADO');
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
        setClientFilter("");
        setBrandId("ALL");
        setPackingFilter("");
        setReceiptFilter("");
    };

    const hasActiveFilters = searchTerm || startDate || endDate || clientFilter || brandId !== "ALL" || packingFilter || receiptFilter;

    return (
        <div className="space-y-4 h-full flex flex-col pt-2">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600 shadow-inner">
                            <Filter size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 leading-tight">Panel de Filtros</h3>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Historial de Recepción</p>
                        </div>
                        {hasActiveFilters && (
                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearFilters}
                            className={`text-slate-500 hover:text-red-600 hover:bg-red-50 h-9 px-4 rounded-lg transition-all border border-transparent ${hasActiveFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Limpiar Filtros
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-9 px-5 font-bold rounded-lg border-slate-200 hover:bg-slate-50 transition-all ${showFilters ? 'bg-slate-100 ring-2 ring-slate-100 border-slate-300' : 'bg-white'}`}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? 'Menos Filtros' : 'Más Filtros'}
                        </Button>
                        <div className="h-10 w-px bg-slate-100 mx-1 hidden md:block" />
                        <div className="text-right px-2">
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter leading-none mb-1">Impacto Total</p>
                            <p className="text-xl font-mono font-black text-emerald-700 leading-none tracking-tighter">${totalGrandReception.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-6">
                    {/* Búsqueda Rápida - 3 cols */}
                    <div className="lg:col-span-3 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Búsqueda Rápida</label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                placeholder="Empresaria, N° Recibo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white border-slate-200 focus:ring-emerald-500/20 transition-all h-10 text-sm font-medium rounded-xl shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Periodo de Tiempo - 4 cols */}
                    <div className="lg:col-span-4 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Periodo de Tiempo</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white border-slate-200 h-10 text-xs font-bold rounded-xl focus:ring-emerald-500/20 shadow-sm transition-all flex-1"
                            />
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter shrink-0 px-1">al</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-white border-slate-200 h-10 text-xs font-bold rounded-xl focus:ring-emerald-500/20 shadow-sm transition-all flex-1"
                            />
                        </div>
                    </div>

                    {/* Identificar Packing - 2 cols */}
                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">ID Packing</label>
                        <Input
                            placeholder="Ej: PK-123"
                            value={packingFilter}
                            onChange={(e) => setPackingFilter(e.target.value)}
                            className="bg-white border-slate-200 h-10 text-sm font-bold rounded-xl focus:ring-emerald-500/20 shadow-sm transition-all"
                        />
                    </div>

                    {/* Catálogo - 3 cols */}
                    <div className="lg:col-span-3 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Catálogo</label>
                        <Select value={brandId} onValueChange={setBrandId}>
                            <SelectTrigger className="bg-white border-slate-200 h-10 text-sm font-bold rounded-xl focus:ring-emerald-500/20 shadow-sm transition-all">
                                <SelectValue placeholder="Todas las marcas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los catálogos</SelectItem>
                                {brands.map((brand: any) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {showFilters && (
                        <>
                            <div className="lg:col-span-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Empresaria</label>
                                <Input
                                    placeholder="Nombre de la empresaria..."
                                    value={clientFilter}
                                    onChange={(e) => setClientFilter(e.target.value)}
                                    className="bg-white border-slate-200 h-10 text-sm font-medium rounded-xl shadow-sm"
                                />
                            </div>
                            <div className="lg:col-span-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Número de Recibo</label>
                                <Input
                                    placeholder="Buscar por recibo..."
                                    value={receiptFilter}
                                    onChange={(e) => setReceiptFilter(e.target.value)}
                                    className="bg-white border-slate-200 h-10 text-sm font-bold rounded-xl shadow-sm"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="border rounded-xl overflow-hidden flex-1 bg-white shadow-sm overflow-y-auto">
                <Table>
                    <TableHeader className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-20">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                            <TableHead className="w-[160px] text-slate-900 font-bold">Fecha / Hora</TableHead>
                            <TableHead className="text-slate-900 font-bold">N° Packing</TableHead>
                            <TableHead className="text-slate-900 font-bold">Registrado Por</TableHead>
                            <TableHead className="text-center text-slate-900 font-bold">Pedidos</TableHead>
                            <TableHead className="text-right text-slate-900 font-bold">Valor Packing</TableHead>
                            <TableHead className="text-right text-slate-900 font-bold">Facturas</TableHead>
                            <TableHead className="text-right text-slate-900 font-bold">Dif.</TableHead>
                            <TableHead className="text-right text-slate-900 font-bold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBatches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <Search size={48} className="mb-2" />
                                        <p className="text-lg font-bold">No se encontraron recepciones</p>
                                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBatches.map(batch => {
                                const totalInvoices = (batch.orders || []).reduce((sum: number, o: any) => sum + Number(o.realInvoiceTotal || 0), 0);
                                const diff = Number(batch.packingTotal) - totalInvoices;
                                const isExpanded = expandedBatch === batch.id;
                                const canModify = checkCanModify(batch);

                                // Format full date and time
                                const receptionDate = new Date(batch.receptionDate);
                                const formattedDate = receptionDate.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                const formattedTime = receptionDate.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <React.Fragment key={batch.id}>
                                        <TableRow className={`hover:bg-slate-50/50 cursor-pointer transition-colors border-b border-slate-50 ${isExpanded ? 'bg-emerald-50/20' : ''}`} onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800">{formattedDate}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">{formattedTime}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{batch.packingNumber}</span>
                                                    {batch.notes && <span className="text-[9px] text-slate-400 truncate max-w-[150px]">{batch.notes}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200">
                                                        {batch.receivedByName?.charAt(0).toUpperCase() || "S"}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {batch.receivedByName || "Sistema"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    {batch.orders?.length || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-emerald-700">
                                                ${Number(batch.packingTotal).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-slate-600">
                                                ${totalInvoices.toFixed(2)}
                                            </TableCell>
                                            <TableCell className={`text-right font-mono text-[10px] ${Math.abs(diff) > 0.1 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                                                ${diff.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => onEdit(batch)}
                                                        disabled={!canModify}
                                                        title={canModify ? "Editar Packing" : "No se puede editar: Pedidos ya entregados"}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => { 
                                                            if (confirm('¿Estás seguro de ELIMINAR todo este packing? Todos los pedidos regresarán a estado PENDIENTE.')) {
                                                                onDelete(batch.id);
                                                            }
                                                        }}
                                                        disabled={!canModify || isDeleting}
                                                        title={canModify ? "Eliminar Packing" : "No se puede eliminar"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className={`h-8 w-8 ${isExpanded ? 'text-emerald-600 bg-emerald-50' : ''}`}
                                                        onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                                                    >
                                                        <Filter className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {isExpanded && (
                                            <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-b border-slate-100">
                                                <TableCell colSpan={8} className="p-0">
                                                    <div className="p-4 border-l-4 border-emerald-500 ml-6 mb-4 mt-2 bg-white rounded-r-lg shadow-sm border border-slate-100">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Detalle de Pedidos en este Packing</h4>
                                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">
                                                                    {batch.orders?.length} ítems
                                                                </span>
                                                            </div>
                                                            {!canModify && (
                                                                <div className="flex items-center gap-1.5 text-[9px] bg-amber-50 text-amber-700 px-3 py-1 rounded border border-amber-100 font-medium">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    <span>Contiene pedidos entregados: Modificación parcial activada.</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {(batch.orders || []).map((order: any) => {
                                                                const pending = getPendingAmount(order);
                                                                const orderCanModify = order.status !== 'ENTREGADO';
                                                                return (
                                                                    <div key={order.id} className="flex flex-wrap justify-between items-center p-3 border border-slate-50 rounded-lg hover:border-emerald-100 hover:bg-emerald-50/10 transition-all group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                                                <Filter size={14} />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs font-bold text-slate-800">{order.clientName}</span>
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-500 tracking-tight">Recibo: {order.receiptNumber}</span>
                                                                                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-500 tracking-tight">Factura: {order.invoiceNumber || '---'}</span>
                                                                                    <span className="text-[9px] text-blue-600 font-bold uppercase tracking-widest ml-1">{order.brandName}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-6 mt-2 sm:mt-0">
                                                                            <div className="text-right">
                                                                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">V. Factura</p>
                                                                                <p className="text-xs font-mono font-bold text-slate-700">${Number(order.realInvoiceTotal || order.total).toFixed(2)}</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Saldo Pend.</p>
                                                                                <p className={`text-xs font-mono font-bold ${pending > 0.01 ? 'text-amber-600' : 'text-slate-300'}`}>
                                                                                    ${pending.toFixed(2)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="w-px h-8 bg-slate-100" />
                                                                            <Button
                                                                                size="icon"
                                                                                variant="outline"
                                                                                className="h-8 w-8 text-amber-600 border-amber-100 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (confirm(`¿Revertir recepción del pedido ${order.receiptNumber}? El pedido regresará a estado POR RECIBIR.`)) {
                                                                                        handleReverseIndividual(order.id);
                                                                                    }
                                                                                }}
                                                                                disabled={isProcessing === order.id || !orderCanModify}
                                                                            >
                                                                                <RotateCcw className={`h-3.5 w-3.5 ${isProcessing === order.id ? 'animate-spin' : ''}`} />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
