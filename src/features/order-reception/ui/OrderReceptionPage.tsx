import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderReceptionList } from "../model/useOrderReception"
import type { ReceptionFilters } from "../model/useOrderReception"
import { OrderReceptionTable } from "./OrderReceptionTable"
import { ReceiveOrderModal } from "./ReceiveOrderModal"
import type { Order } from "@/entities/order/model/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, History, PackageCheck, RotateCcw } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { useToast } from "@/shared/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/shared/ui/PageHeader"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Pagination } from "@/shared/ui/pagination"
import { useDebounce } from "@/shared/lib/hooks"

export function OrderReceptionPage() {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const qc = useQueryClient()

    // State
    const [page, setPage] = useState(1)
    const [limit] = useState(25)
    const [searchText, setSearchText] = useState("")
    const debouncedSearch = useDebounce(searchText, 500)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

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
        page,
        limit
    }

    const { data: response, isLoading, isError, refetch } = useOrderReceptionList(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    // Reset page on filter change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate])

    const handleReceive = (order: Order) => {
        setSelectedOrder(order)
        setIsReceiveModalOpen(true)
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

    const clearFilters = () => {
        setSearchText("");
        setStartDate("");
        setEndDate("");
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
                <div className="flex-1 min-w-[280px] space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Buscar Cliente / Recibo</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre, recibo..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full sm:w-auto space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Desde (Entrega)</label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-11 border-slate-200 rounded-xl"
                    />
                </div>
                <div className="w-full sm:w-auto space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hasta (Entrega)</label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-11 border-slate-200 rounded-xl"
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
