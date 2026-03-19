import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderReceptionHistory } from "../model/useOrderReception"
import type { ReceptionFilters } from "../model/useOrderReception"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, Search, RotateCcw, History } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { useToast } from "@/shared/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Pagination } from "@/shared/ui/pagination"
import { useDebounce } from "@/shared/lib/hooks"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"

export function OrderReceptionHistoryPage() {
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

    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [orderToReverse, setOrderToReverse] = useState<string | null>(null)

    // Filters
    const filters: ReceptionFilters = {
        searchText: debouncedSearch,
        startDate,
        endDate,
        page,
        limit
    }

    const { data: response, isLoading, refetch } = useOrderReceptionHistory(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    // Reset page on filter change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate])

    function formatDate(date: string) {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('es-EC', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    function formatCurrency(amount: number) {
        return `$${amount.toFixed(2)}`
    }

    const handleReverseReception = async (orderId: string) => {
        setIsProcessing(orderId)
        try {
            await orderApi.reverseReception(orderId)
            showToast("El pedido ha vuelto al estado pendiente de recepción.", "success")
            await qc.invalidateQueries({ queryKey: ['orders'] })
            refetch()
        } catch (error) {
            showToast(error instanceof Error ? error.message : "No se pudo regresar la recepción", "error")
        } finally {
            setIsProcessing(null)
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
                title="Historial de Recepciones" 
                description="Registro histórico de pedidos recibidos en bodega"
                icon={History}
                actions={
                    <div className="flex gap-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 font-bold text-slate-400">
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Recepción
                        </Button>
                        <Button variant="outline" onClick={clearFilters} title="Limpiar todos los filtros" className="h-10 w-10 p-0 rounded-xl">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                }
            />

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[280px] space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Buscar Cliente / Recibo / Factura</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre, recibo, factura..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full sm:w-auto space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Desde (Recepción)</label>
                    <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-11 border-slate-200 rounded-xl"
                    />
                </div>
                <div className="w-full sm:w-auto space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hasta (Recepción)</label>
                    <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="h-11 border-slate-200 rounded-xl"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">Fecha Recepción</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">N° Recibo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">Empresaria / Cliente</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">N° Factura</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 text-right">Valor Estimado</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 text-right">Valor Real</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 text-center">Estado</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-8 w-8 border-4 border-slate-100 border-t-monchito-purple rounded-full animate-spin" />
                                        <span className="font-bold text-slate-400">Cargando historial...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-20 text-slate-300 italic">
                                    No se encontraron registros de recepciones pasadas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-slate-50/30 border-slate-50 transition-colors">
                                    <TableCell className="font-bold text-slate-700 py-4 px-6">
                                        {formatDate(order.receptionDate!)}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 font-mono font-bold text-[11px] text-slate-600">
                                        #{order.receiptNumber}
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="font-black text-slate-800 uppercase text-xs">{order.clientName}</div>
                                        <div className="text-[10px] text-monchito-purple font-black">{order.brandName}</div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 font-mono text-[11px] text-slate-500">
                                        {order.invoiceNumber || '-'}
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6 text-slate-400 text-xs">
                                        {formatCurrency(order.total)}
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6 font-mono font-black text-slate-800">
                                        {formatCurrency(order.realInvoiceTotal || order.total)}
                                    </TableCell>
                                    <TableCell className="text-center py-4 px-6">
                                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${
                                            order.status === 'RECIBIDO_EN_BODEGA'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                            {order.status === 'RECIBIDO_EN_BODEGA' ? 'En Bodega' : 'Entregado'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        {order.status === 'RECIBIDO_EN_BODEGA' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl"
                                                onClick={() => {
                                                    setOrderToReverse(order.id);
                                                    setConfirmOpen(true);
                                                }}
                                                disabled={isProcessing === order.id}
                                                title="Regresar recepción"
                                            >
                                                <RotateCcw className={`h-4 w-4 ${isProcessing === order.id ? 'animate-spin' : ''}`} />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

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
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={() => {
                    if (orderToReverse) {
                        handleReverseReception(orderToReverse);
                        setOrderToReverse(null);
                    }
                }}
                title="Revertir Recepción"
                description='¿Está seguro de regresar la recepción de este pedido? Se revertirán los abonos asociados y el estado volverá a "POR RECIBIR".'
                confirmText="Sí, Revertir"
                variant="destructive"
            />
        </div>
    )
}
