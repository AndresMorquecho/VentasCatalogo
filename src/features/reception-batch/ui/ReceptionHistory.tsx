import React, { useState } from "react"
import { Search, RotateCcw, Edit, Trash2, AlertCircle, Filter, ChevronRight, FileDown, Loader2 } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { exportReceptionBatchesToExcel } from "@/shared/lib/exportExcel"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select"
import { useBrandList } from "@/features/brands/api/hooks"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Pagination } from "@/shared/ui/pagination"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"

interface Props {
    batches: any[]
    pagination?: any
    onEdit: (batch: any) => void
    onDelete: (batchId: string) => void
    isDeleting?: boolean
    page: number
    onPageChange: (page: number) => void
    filters: {
        startDate: string;
        endDate: string;
        brandId: string;
        packingNumber: string;
    }
    onFilterChange: (filters: any) => void
}

export function ReceptionHistory({ 
    batches, 
    pagination, 
    onEdit, 
    onDelete, 
    isDeleting,
    page,
    onPageChange,
    filters,
    onFilterChange
}: Props) {
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null)

    // ConfirmDialog state - delete batch
    const [deleteBatchConfirmOpen, setDeleteBatchConfirmOpen] = useState(false)
    const [batchToDelete, setBatchToDelete] = useState<string | null>(null)

    // ConfirmDialog state - reverse individual order
    const [reverseOrderConfirmOpen, setReverseOrderConfirmOpen] = useState(false)
    const [orderToReverse, setOrderToReverse] = useState<{ id: string, receiptNumber: string } | null>(null)

    const { showToast } = useToast()
    const queryClient = useQueryClient()
    const [isExporting, setIsExporting] = useState(false)

    // Real brands from database
    const { data: brandsData } = useBrandList({ limit: 100 });
    const brands = brandsData?.data || [];

    // Convertir strings de filtros a DateRange
    const dateRange: DateRange | undefined = filters.startDate && filters.endDate ? {
        from: new Date(filters.startDate),
        to: new Date(filters.endDate),
    } : undefined;

    const handleDateRangeChange = (range: DateRange | undefined) => {
        onFilterChange({
            ...filters,
            startDate: range?.from ? range.from.toISOString().split('T')[0] : '',
            endDate: range?.to ? range.to.toISOString().split('T')[0] : '',
        });
        onPageChange(1);
    };

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            // Fetch ALL batches that match currently active filters (page=1, limit=1000 to get everything)
            const allBatchesResponse = await orderApi.getReceptionBatches({
                ...filters,
                page: 1,
                limit: 1000 // Large limit to ensure we get all records
            });

            if (allBatchesResponse && allBatchesResponse.data.length > 0) {
                exportReceptionBatchesToExcel(
                    allBatchesResponse.data, 
                    `Historial_Recepciones_${new Date().toISOString().split('T')[0]}.xlsx`,
                    filters
                );
                showToast("Exportación completada", "success");
            } else {
                showToast("No hay datos para exportar", "warning");
            }
        } catch (error) {
            console.error(error);
            showToast("Error al exportar a Excel", "error");
        } finally {
            setIsExporting(false);
        }
    }

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

    const totalGrandReception = batches.reduce((sum, b) => sum + Number(b.packingTotal || 0), 0);

    const checkCanModify = (batch: any) => {
        return !batch.orders?.some((o: any) => o.status === 'ENTREGADO');
    };

    const clearFilters = () => {
        onFilterChange({
            startDate: '',
            endDate: '',
            brandId: 'ALL',
            packingNumber: ''
        });
        onPageChange(1);
    };

    const hasActiveFilters = filters.startDate || filters.endDate || filters.brandId !== "ALL" || filters.packingNumber;

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

                        <div className="h-10 w-px bg-slate-100 mx-1 hidden md:block" />
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleExportExcel}
                            disabled={isExporting || batches.length === 0}
                            className="h-9 px-5 font-bold rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all gap-2"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> : <FileDown className="h-4 w-4 text-emerald-500" />}
                            {isExporting ? 'Exportando...' : 'Exportar Excel'}
                        </Button>
                        <div className="h-10 w-px bg-slate-100 mx-1 hidden md:block" />
                        <div className="text-right px-2">
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter leading-none mb-1">Impacto Total (Pág)</p>
                            <p className="text-xl font-mono font-black text-emerald-700 leading-none tracking-tighter">${totalGrandReception.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-6">


                    {/* Periodo de Tiempo - 6 cols */}
                    <div className="lg:col-span-6 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Periodo de Tiempo</label>
                        <DateRangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            placeholder="Seleccionar rango de fechas"
                            showLabel={false}
                        />
                    </div>

                    {/* Identificar Packing - 3 cols */}
                    <div className="lg:col-span-3 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">ID Packing</label>
                        <Input
                            placeholder="Ej: PK-123"
                            value={filters.packingNumber}
                            onChange={(e) => {
                                onFilterChange({ ...filters, packingNumber: e.target.value });
                                onPageChange(1);
                            }}
                            className="bg-white border-slate-200 h-10 text-sm font-bold rounded-xl focus:ring-emerald-500/20 shadow-sm transition-all"
                        />
                    </div>

                    {/* Catálogo - 3 cols */}
                    <div className="lg:col-span-3 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Catálogo</label>
                        <Select value={filters.brandId} onValueChange={(val) => {
                            onFilterChange({ ...filters, brandId: val });
                            onPageChange(1);
                        }}>
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
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex-1 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-monchito-purple/5 hover:bg-monchito-purple/5 border-b border-monchito-purple/10 sticky top-0 z-20">
                            <TableHead className="w-[160px] text-[10px] font-black text-monchito-purple uppercase tracking-widest h-12">Fecha / Hora</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">N° Packing</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Registrado Por</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-monchito-purple uppercase tracking-widest">Pedidos</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Valor Packing</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Facturas</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Dif.</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.length === 0 ? (
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
                            batches.map(batch => {
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
                                        <TableRow className={`hover:bg-monchito-purple/5 cursor-pointer transition-colors border-b border-slate-50 ${isExpanded ? 'bg-monchito-purple/10' : ''}`} onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800">{formattedDate}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">{formattedTime}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{batch.packingNumber}</span>
                                                    {batch.notes && <span className="text-[9px] text-slate-400 truncate max-w-[150px]">{batch.notes}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200">
                                                        {batch.receivedByName?.charAt(0).toUpperCase() || "S"}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {batch.receivedByName || "Sistema"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    {batch.orders?.length || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-emerald-700 py-4">
                                                ${Number(batch.packingTotal).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-slate-600 py-4">
                                                ${totalInvoices.toFixed(2)}
                                            </TableCell>
                                            <TableCell className={`text-right font-mono text-[10px] py-4 ${Math.abs(diff) > 0.1 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                                                ${diff.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
                                                        onClick={() => onEdit(batch)}
                                                        disabled={!canModify}
                                                        title={canModify ? "Editar Packing" : "No se puede editar: Pedidos ya entregados"}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                                                        onClick={() => {
                                                            setBatchToDelete(batch.id);
                                                            setDeleteBatchConfirmOpen(true);
                                                        }}
                                                        disabled={!canModify || isDeleting}
                                                        title={canModify ? "Eliminar Packing" : "No se puede eliminar"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className={`h-8 w-8 rounded-lg transition-all ${isExpanded ? 'text-monchito-purple bg-monchito-purple/10' : 'text-slate-600 hover:text-monchito-purple hover:bg-monchito-purple/10'}`}
                                                        onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                                                    >
                                                        <ChevronRight className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
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
                                                                                    setOrderToReverse({ id: order.id, receiptNumber: order.receiptNumber });
                                                                                    setReverseOrderConfirmOpen(true);
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

            {pagination && (
                <div className="mt-auto">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.pages}
                        onPageChange={onPageChange}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                    />
                </div>
            )}

            {/* Confirm: Delete Batch */}
            <ConfirmDialog
                open={deleteBatchConfirmOpen}
                onOpenChange={setDeleteBatchConfirmOpen}
                onConfirm={() => {
                    if (batchToDelete) {
                        onDelete(batchToDelete);
                        setBatchToDelete(null);
                    }
                }}
                title="Eliminar Packing"
                description="¿Estás seguro de ELIMINAR todo este packing? Todos los pedidos regresarán a estado PENDIENTE. Esta acción no se puede deshacer."
                confirmText="Sí, Eliminar"
                variant="destructive"
            />

            {/* Confirm: Reverse Individual Order */}
            <ConfirmDialog
                open={reverseOrderConfirmOpen}
                onOpenChange={setReverseOrderConfirmOpen}
                onConfirm={() => {
                    if (orderToReverse) {
                        handleReverseIndividual(orderToReverse.id);
                        setOrderToReverse(null);
                    }
                }}
                title="Revertir Recepción"
                description={`¿Revertir recepción del pedido ${orderToReverse?.receiptNumber}? El pedido regresará a estado POR RECIBIR.`}
                confirmText="Sí, Revertir"
                variant="destructive"
            />
        </div>
    )
}
