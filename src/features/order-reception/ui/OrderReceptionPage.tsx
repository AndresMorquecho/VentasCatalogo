import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderReceptionList } from "../model/useOrderReception"
import type { ReceptionFilters } from "../model/useOrderReception"
import { OrderReceptionTable } from "./OrderReceptionTable"
import { ReceiveOrderModal } from "./ReceiveOrderModal"
import type { Order } from "@/entities/order/model/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, History, PackageCheck, RotateCcw, FileDown, Loader2 } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { exportOrdersToExcel } from "@/shared/lib/exportExcel"
import { useToast } from "@/shared/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/shared/ui/PageHeader"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Pagination } from "@/shared/ui/pagination"
import { useDebounce } from "@/shared/lib/hooks"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"

// MIGRATED TO DATERANGEPICKER - v2.0

export function OrderReceptionPage() {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const qc = useQueryClient()

    // State
    const [page, setPage] = useState(1)
    const [limit] = useState(25)
    const [searchText, setSearchText] = useState("")
    const debouncedSearch = useDebounce(searchText, 500)
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [orderType, setOrderType] = useState("all")
    const [isExporting, setIsExporting] = useState(false)

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [reverseConfirmOpen, setReverseConfirmOpen] = useState(false)
    const [orderToReverse, setOrderToReverse] = useState<string | null>(null)

    // Filters
    const filters: ReceptionFilters = {
        searchText: debouncedSearch,
        startDate,
        endDate,
        orderType,
        page,
        limit
    }

    const { data: response, isLoading, isError, refetch } = useOrderReceptionList(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    // Reset page on filter change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate, orderType])

    const handleReceive = async (order: Order) => {
        // Opción 2: Validación Justo a Tiempo (UX Preventiva)
        setIsProcessing(order.id);
        try {
            const freshOrder = await orderApi.getById(order.id);
            // Verificar que aún esté en un estado válido para recepción
            if (!['POR_RECIBIR', 'EN_TRANSITO'].includes(freshOrder.status)) {
                showToast("Este pedido ya ha sido procesado o actualizado por otro usuario.", "warning");
                qc.invalidateQueries({ queryKey: ['orders'] });
                return;
            }
            setSelectedOrder(freshOrder);
            setIsReceiveModalOpen(true);
        } catch (error) {
            console.error("Error verifying order status", error);
            showToast("No se pudo verificar el estado actual del pedido.", "error");
        } finally {
            setIsProcessing(null);
        }
    }

    const handleReverse = (orderId: string) => {
        setOrderToReverse(orderId);
        setReverseConfirmOpen(true);
    }

    const confirmReverse = async () => {
        if (!orderToReverse) return;
        setIsProcessing(orderToReverse)
        try {
            await orderApi.reverseReception(orderToReverse)
            showToast("La recepción ha sido revertida correctamente.", "success")
            await qc.invalidateQueries({ queryKey: ['orders'] })
            refetch()
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al revertir recepción", "error")
        } finally {
            setIsProcessing(null)
            setOrderToReverse(null)
        }
    }

    const handleMainKeyDown = (e: React.KeyboardEvent, group: string, index: number) => {
        const input = e.currentTarget as HTMLInputElement;
        const isInput = input.tagName === 'INPUT';
        const isNumber = isInput && input.type === 'number';
        const isDate = isInput && input.type === 'date';
        
        let selectionStart: number | null = null;
        let valueLength = 0;

        try {
            if (isInput && !isNumber && !isDate) {
                selectionStart = input.selectionStart;
                valueLength = input.value.length;
            }
        } catch (err) {}

        if (e.key === 'ArrowRight') {
            const isAtEnd = !isInput || isDate || selectionStart === valueLength;
            if (isAtEnd) {
                const next = document.querySelector(`[data-nav-group="${group}"][data-nav-index="${index + 1}"]`) as HTMLElement;
                if (next) {
                    e.preventDefault();
                    next.focus();
                    if (next instanceof HTMLInputElement && next.type !== 'number' && next.type !== 'date') next.select();
                }
            }
        } else if (e.key === 'ArrowLeft') {
            const isAtStart = !isInput || isDate || selectionStart === 0;
            if (isAtStart) {
                const prev = document.querySelector(`[data-nav-group="${group}"][data-nav-index="${index - 1}"]`) as HTMLElement;
                if (prev) {
                    e.preventDefault();
                    prev.focus();
                    if (prev instanceof HTMLInputElement && prev.type !== 'number' && prev.type !== 'date') prev.select();
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const table = document.querySelector('table');
            if (table) {
                const firstInput = table.querySelector('input, button') as HTMLElement;
                if (firstInput) firstInput.focus();
            }
        } else if (e.key === 'Enter' && isDate) {
            e.preventDefault();
            if ('showPicker' in input) (input as any).showPicker();
        }
    };

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            // Fetch ALL matching records — no page, no limit → backend returns everything
            const response = await orderApi.getAll({
                status: 'POR_RECIBIR,EN_TRANSITO',
                search: debouncedSearch || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                type: orderType !== 'all' ? orderType : undefined,
            });
            if (response && response.data.length > 0) {
                exportOrdersToExcel(response.data, `Pedidos_PorRecibir_${new Date().toISOString().split('T')[0]}.xlsx`, undefined, false);
                showToast("Exportación completada", "success");
            } else {
                showToast("No hay registros para exportar", "warning");
            }
        } catch (error) {
            console.error(error);
            showToast("Error al exportar", "error");
        } finally {
            setIsExporting(false);
        }
    }

    const clearFilters = () => {
        setSearchText("");
        setDateRange(undefined);
        setOrderType("all");
        setPage(1);
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Packing (Bodega)" 
                description="Gestión de llegada de pedidos y ajuste de facturación"
                icon={PackageCheck}
                actions={
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            onClick={handleExportExcel}
                            disabled={isExporting || orders.length === 0}
                            className="gap-2 rounded-xl h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                            {isExporting ? 'Exportando...' : 'Exportar Excel'}
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/orders/reception/history')} className="gap-2 rounded-xl h-10">
                            <History className="h-4 w-4" />
                            Historial
                        </Button>
                        <Button variant="outline" onClick={clearFilters} title="Limpiar todos los filtros" className="h-10 w-10 p-0 rounded-xl">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                }
            />

            {/* Filters Bar */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[280px]">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block">Buscar Cliente / Recibo</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre, recibo..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            data-nav-group="reception-filters"
                            data-nav-index={0}
                            onKeyDown={(e) => handleMainKeyDown(e, 'reception-filters', 0)}
                        />
                    </div>
                </div>

                {/* TIPO filter */}
                <div className="w-full sm:w-auto min-w-[180px]">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block">Tipo</label>
                    <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple transition-all"
                    >
                        <option value="all">Cualquier Tipo</option>
                        <option value="NORMAL">Normal</option>
                        <option value="CAMBIO">Cambio</option>
                        <option value="REPROGRAMACION">Repro</option>
                        <option value="PREVENTA">Preventa</option>
                    </select>
                </div>

                <div className="w-full sm:w-auto min-w-[280px]">
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        label="Rango de Entrega"
                        placeholder="Seleccionar fechas"
                        className="h-11"
                        showLabel={true}
                        data-nav-group="reception-filters"
                        data-nav-index={1}
                        onKeyDown={(e) => handleMainKeyDown(e, 'reception-filters', 1)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <div className="h-10 w-10 border-4 border-slate-100 border-t-monchito-purple rounded-full animate-spin" />
                        <span className="font-bold text-sm">Cargando pedidos para recepción...</span>
                    </div>
                ) : isError ? (
                    <div className="p-20 text-center text-red-500 font-bold">Error al cargar pedidos.</div>
                ) : (
                    <>
                        <OrderReceptionTable
                            orders={orders}
                            onReceive={handleReceive}
                            onReverse={handleReverse}
                            isProcessing={isProcessing}
                        />
                        {pagination && pagination.pages > 1 && (
                            <div className="p-4 border-t border-slate-100">
                                <Pagination
                                    currentPage={page}
                                    totalPages={pagination.pages}
                                    onPageChange={setPage}
                                    totalItems={pagination.total}
                                    itemsPerPage={limit}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            <ReceiveOrderModal
                order={selectedOrder}
                open={isReceiveModalOpen}
                onOpenChange={setIsReceiveModalOpen}
            />

            <ConfirmDialog
                open={reverseConfirmOpen}
                onOpenChange={setReverseConfirmOpen}
                onConfirm={confirmReverse}
                title="Revertir Recepción"
                description='¿Está seguro de regresar la recepción de este pedido? Se revertirán los abonos asociados y el estado volverá a "POR RECIBIR".'
                confirmText="Sí, Revertir"
                variant="destructive"
            />
        </div>
    )
}
