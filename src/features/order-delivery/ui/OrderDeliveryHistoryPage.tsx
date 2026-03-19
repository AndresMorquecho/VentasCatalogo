import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderDeliveryHistory } from "../model/useOrderDelivery"
import type { DeliveryFilters } from "../model/useOrderDelivery"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, Search, Printer, History } from "lucide-react"
import { useAuth } from "@/shared/auth"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { prepareDeliveryReceiptForPreview } from "../lib/generateDeliveryReceiptWithPreview"
import { useNotifications } from "@/shared/lib/notifications"
import { Pagination } from "@/shared/ui/pagination"
import { PageHeader } from "@/shared/ui/PageHeader"
import { useDebounce } from "@/shared/lib/hooks"
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

    // State
    const [page, setPage] = useState(1)
    const [limit] = useState(25)
    const [searchText, setSearchText] = useState("")
    const debouncedSearch = useDebounce(searchText, 500)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate])

    const filters: DeliveryFilters = {
        searchText: debouncedSearch,
        startDate,
        endDate,
        page,
        limit
    }

    const { data: response, isLoading } = useOrderDeliveryHistory(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    const [pdfTitle, setPdfTitle] = useState("")
    const [pdfFileName, setPdfFileName] = useState("")
    
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
            const { document, fileName, title } = await prepareDeliveryReceiptForPreview(order, {
                amountPaidNow: 0,
                method: order.paymentMethod || 'N/A',
                user: order.deliveredByName || user?.username || 'Administrador'
            })
            
            setPdfTitle(title)
            setPdfFileName(fileName)
            pdfPreview.openPreview(document)
        } catch (error) {
            console.error("Error preparing delivery history PDF:", error)
            notifyError({ message: 'Error al preparar el comprobante' })
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Historial de Entregas" 
                description="Registro de pedidos entregados y comprobantes generados"
                icon={History}
                actions={
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 font-bold text-slate-400">
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Entregas
                    </Button>
                }
            />

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[280px] space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Buscar Pedido / Cliente</label>
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
                <div className="w-full sm:w-auto space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha Inicial (Entrega)</label>
                    <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-11 border-slate-200 rounded-xl"
                    />
                </div>
                <div className="w-full sm:w-auto space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha Final (Entrega)</label>
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
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">Fecha Entrega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">Empresaria / Cliente</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">N° Recibo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 text-right">Total Real</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 text-center">Bodega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 text-center">Estado</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 text-right">Acciones</TableHead>
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
                                <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-slate-400 hover:text-monchito-purple hover:bg-monchito-purple/10 rounded-xl"
                                            onClick={() => handlePrintPreview(order)}
                                        >
                                            <Printer className="h-4 w-4" />
                                        </Button>
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
        </div>
    )
}
