import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderDeliveryHistory } from "../model/useOrderDelivery"
import type { DeliveryFilters } from "../model/useOrderDelivery"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, Search, Printer, History, FileDown, Loader2 } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { exportOrdersToExcel } from "@/shared/lib/exportExcel"
import { useAuth } from "@/shared/auth"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { prepareDeliveryReceiptForPreview } from "../lib/generateDeliveryReceiptWithPreview"
import { useNotifications } from "@/shared/lib/notifications"
import { Pagination } from "@/shared/ui/pagination"
import { PageHeader } from "@/shared/ui/PageHeader"
import { useDebounce } from "@/shared/lib/hooks"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"
import { RotateCcw } from "lucide-react"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"

export function OrderDeliveryHistoryPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { notifySuccess, notifyError } = useNotifications()
    const [isExporting, setIsExporting] = useState(false)

    // State
    const [page, setPage] = useState(1)
    const [limit] = useState(25)
    const [searchText, setSearchText] = useState("")
    const debouncedSearch = useDebounce(searchText, 500)
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate])

    const filters: DeliveryFilters = useMemo(() => ({
        searchText: debouncedSearch,
        startDate,
        endDate,
        page,
        limit
    }), [debouncedSearch, startDate, endDate, page, limit])

    const { data: response, isLoading, refetch } = useOrderDeliveryHistory(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    const [pdfTitle, setPdfTitle] = useState("")
    const [pdfFileName, setPdfFileName] = useState("")
    
    // Reverse delivery confirmation state
    const [isReverseModalOpen, setIsReverseModalOpen] = useState(false)
    const [orderToReverse, setOrderToReverse] = useState<any>(null)
    const [isReversing, setIsReversing] = useState(false)
    
    const pdfPreview = usePDFPreview({
        fileName: pdfFileName,
        onDownloadComplete: () => notifySuccess('Comprobante descargado'),
        onError: () => notifyError({ message: 'Error al procesar el PDF' })
    })

    function formatDate(date: string) {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('es-EC', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    function formatCurrency(amount: number) {
        return `$${amount.toFixed(2)}`
    }

    function calculateDaysInWarehouse(order: any) {
        if (!order.receptionDate || !order.deliveryDate) return '-'
        const start = new Date(order.receptionDate).getTime()
        const end = new Date(order.deliveryDate).getTime()
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        return `${diff} días`
    }

    const handlePrintPreview = async (order: any) => {
        try {
            const { document, fileName, title } = await prepareDeliveryReceiptForPreview(
                order, 
                {
                    amountPaidNow: 0, 
                    method: order.paymentMethod || 'N/A',
                    user: order.deliveredByName || user?.username || 'Administrador'
                },
                order.receiptNumber
            )
            
            setPdfTitle(title)
            setPdfFileName(fileName)
            pdfPreview.openPreview(document)
        } catch (error) {
            console.error("Error preparing delivery history PDF:", error)
            notifyError({ message: 'Error al preparar el comprobante' })
        }
    }
    
    const handleReverseDelivery = async (order: any) => {
        setOrderToReverse(order)
        setIsReverseModalOpen(true)
    }

    const confirmReverseDelivery = async () => {
        if (!orderToReverse) return

        try {
            setIsReversing(true)
            await orderApi.reverseDelivery(orderToReverse.id)
            notifySuccess('Entrega cancelada y saldos reversados')
            refetch()
        } catch (error) {
            console.error("Error reversing delivery:", error)
            notifyError({ message: error instanceof Error ? error.message : 'Error al cancelar la entrega' })
        } finally {
            setIsReversing(false)
            setOrderToReverse(null)
        }
    }

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const response = await orderApi.getAll({
                status: 'ENTREGADO',
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                search: debouncedSearch || undefined,
                page: 1,
                limit: 2000
            })
            
            if (response && response.data.length > 0) {
                exportOrdersToExcel(response.data, `Historial_Entregas_${new Date().toISOString().split('T')[0]}.xlsx`)
                notifySuccess('Exportación completada')
            } else {
                notifyError({ message: 'No hay datos para exportar' })
            }
        } catch (error) {
            console.error("Error exporting excel:", error)
            notifyError({ message: 'Error al exportar' })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Historial de Entregas" 
                description="Registro de pedidos entregados y comprobantes generados"
                icon={History}
                actions={
                    <div className="flex gap-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 font-bold text-slate-400">
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Entregas
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="bg-white hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 gap-2 h-10 rounded-xl"
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="h-4 w-4 text-emerald-600" />
                            )}
                            Exportar Excel
                        </Button>
                    </div>
                }
            />

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[280px]">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block">Buscar Pedido / Cliente</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre, recibo o número de orden..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full sm:w-auto min-w-[280px]">
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        label="Rango de Entrega"
                        placeholder="Seleccionar periodo"
                        className="h-11"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-monchito-purple/10 shadow-xl overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-monchito-purple/5">
                        <TableRow className="border-monchito-purple/10 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6">Fecha Entrega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6">Empresaria / Cliente</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6">N° Recibo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-right">Total Real</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">Bodega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">Estado</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-8 w-8 border-4 border-slate-100 border-t-monchito-purple rounded-full animate-spin" />
                                        <span className="font-bold text-slate-400">Cargando historial...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <History className="h-12 w-12 opacity-20" />
                                        <p className="font-black uppercase tracking-widest text-sm">No se encontraron entregas</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-monchito-purple/5 border-monchito-purple/5 transition-all duration-200">
                                    <TableCell className="font-bold text-slate-700 py-4 px-6">
                                        {formatDate(order.deliveryDate!)}
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="font-black text-slate-800 uppercase text-xs">{order.clientName}</div>
                                        <div className="text-[10px] text-monchito-purple font-black">{order.brandName}</div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-[11px] font-mono font-bold text-slate-600">
                                            #{order.receiptNumber}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6 font-mono font-black text-slate-800">
                                        {formatCurrency(order.realInvoiceTotal || order.total)}
                                    </TableCell>
                                    <TableCell className="text-center py-4 px-6">
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {calculateDaysInWarehouse(order)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center py-4 px-6">
                                        <span className="inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest bg-emerald-100 text-emerald-700 uppercase">
                                            ENTREGADO
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl"
                                                onClick={() => handleReverseDelivery(order)}
                                                title="Cancelar Entrega (Regresar a Por Entregar)"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-400 hover:text-monchito-purple hover:bg-monchito-purple/10 rounded-xl"
                                                onClick={() => handlePrintPreview(order)}
                                                title="Imprimir Comprobante"
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </div>
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

            {pdfPreview.pdfDocument && (
                <PDFPreviewModal
                    open={pdfPreview.isOpen}
                    onOpenChange={pdfPreview.closePreview}
                    title={pdfTitle}
                    pdfDocument={pdfPreview.pdfDocument}
                    fileName={pdfFileName}
                    onDownload={pdfPreview.downloadPDF}
                    onPrint={pdfPreview.printPDF}
                />
            )}

            <ConfirmDialog
                open={isReverseModalOpen}
                onOpenChange={setIsReverseModalOpen}
                onConfirm={confirmReverseDelivery}
                title="¿Cancelar Entrega?"
                description={`¿Estás seguro de cancelar la entrega del pedido #${orderToReverse?.receiptNumber}? El pedido volverá a estar en estado "POR ENTREGAR" y los cobros realizados durante la entrega se reversarán de la billetera virtual o caja.`}
                confirmText={isReversing ? "Cancelando..." : "Confirmar Cancelación"}
                cancelText="Cerrar"
                variant="destructive"
            />
        </div>
    )
}
