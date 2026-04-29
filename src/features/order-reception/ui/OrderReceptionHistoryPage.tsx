import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderReceptionHistory } from "../model/useOrderReception"
import type { ReceptionFilters } from "../model/useOrderReception"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, Search, RotateCcw, History, FileDown, Loader2 } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { exportOrdersToExcel } from "@/shared/lib/exportExcel"
import { useToast } from "@/shared/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Pagination } from "@/shared/ui/pagination"
import { useDebounce } from "@/shared/lib/hooks"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"
import { useAuth } from "@/shared/auth"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"

export function OrderReceptionHistoryPage() {
    const { hasPermission } = useAuth()
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

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [orderToReverse, setOrderToReverse] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    // Filters
    const filters: ReceptionFilters = {
        searchText: debouncedSearch,
        startDate,
        endDate,
        orderType,
        page,
        limit
    }

    const { data: response, isLoading, refetch } = useOrderReceptionHistory(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    // Reset page on filter change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate, orderType])

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

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            // Fetch ALL history with matching filters
            const response = await orderApi.getAll({
                status: 'RECIBIDO_EN_BODEGA,ENTREGADO',
                search: debouncedSearch || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                type: orderType !== 'all' ? orderType : undefined,
                // no limit -> returns everything
            });

            if (response && response.data.length > 0) {
                exportOrdersToExcel(response.data, `Historial_Recepciones_Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`, undefined, false);
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
                title="Historial de Recepciones" 
                description="Registro histórico de pedidos recibidos en bodega"
                icon={History}
                actions={
                    <div className="flex gap-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/orders/reception/new")} className="gap-2 font-bold text-slate-400 hover:text-monchito-purple hover:bg-monchito-purple/5 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Recepción
                        </Button>
                        {hasPermission('reception.export_excel') && (
                            <Button 
                                variant="outline" 
                                onClick={handleExportExcel} 
                                disabled={isExporting || orders.length === 0}
                                className="gap-2 rounded-xl h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                            >
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> : <FileDown className="h-4 w-4 text-emerald-500" />}
                                {isExporting ? 'Exportando...' : 'Exportar Excel'}
                            </Button>
                        )}
                        <Button variant="outline" onClick={clearFilters} title="Limpiar todos los filtros" className="h-10 w-10 p-0 rounded-xl">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                }
            />

            {/* Filtros alineados con labels estandarizados */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-6">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-[0.1em]">Buscar Cliente / Recibo / Factura</label>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre, número de recibo o factura..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white transition-all text-sm"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                <div className="md:col-span-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-[0.1em]">Tipo</label>
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
                
                <div className="md:col-span-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-[0.1em]">Rango de Recepción</label>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder="Seleccionar periodo"
                        showLabel={false}
                        buttonClassName="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-monchito-purple/10 shadow-xl overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-monchito-purple/5">
                        <TableRow className="border-monchito-purple/10 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6">Fecha Recepción</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6">N° Recibo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6">Empresaria / Cliente</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6">N° Factura</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-right">Valor Estimado</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-right">Valor Real</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">Estado</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-right">Acción</TableHead>
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
                                <TableRow key={order.id} className="hover:bg-monchito-purple/5 border-monchito-purple/5 transition-all duration-200">
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
