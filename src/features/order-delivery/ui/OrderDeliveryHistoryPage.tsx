import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useDeliveryBatches } from "../model/useOrderDelivery"
import type { DeliveryFilters } from "../model/useOrderDelivery"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, Search, Printer, History, FileDown, Loader2 } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { exportOrdersToExcel } from "@/shared/lib/exportExcel"
import { useAuth } from "@/shared/auth"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { prepareBatchDeliveryReceiptForPreview } from "../lib/generateDeliveryReceiptWithPreview"
import { useNotifications } from "@/shared/lib/notifications"
import { Pagination } from "@/shared/ui/pagination"
import { PageHeader } from "@/shared/ui/PageHeader"
import { useDebounce } from "@/shared/lib/hooks"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"
import { RotateCcw, ChevronDown } from "lucide-react"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { cn } from "@/shared/lib/utils"
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
    const [limit] = useState(15)
    const [searchText, setSearchText] = useState("")
    const debouncedSearch = useDebounce(searchText, 500)
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

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

    const { data: response, isLoading, refetch } = useDeliveryBatches(filters)
    const batches = response?.data || []
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

    const handlePrintPreview = async (batch: any) => {
        try {
            // Aggregate totals and methods for the batch
            const totalPaid = (batch.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const methods = Array.from(new Set((batch.payments || []).map((p: any) => p.method))).join(' | ') || 'N/A';
            
            const { document, fileName, title } = await prepareBatchDeliveryReceiptForPreview(
                batch.orders || [], 
                {
                    amountPaidNow: totalPaid, 
                    method: methods,
                    user: batch.deliveredByName || user?.username || 'Administrador'
                },
                batch.deliveryNumber || 'S/N'
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
            await orderApi.deleteDeliveryBatch(orderToReverse.id)
            notifySuccess('Lote de entrega eliminado y saldos reversados correctamente')
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

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1 mb-1.5 block">Buscar Pedido / Cliente</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre, recibo o número de orden..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        label="Rango de Entrega"
                        placeholder="Seleccionar periodo"
                        buttonClassName="h-11 border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                        labelClassName="text-slate-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-monchito-purple/10 shadow-xl overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-monchito-purple/5">
                        <TableRow className="border-monchito-purple/10 hover:bg-transparent tracking-tighter">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">N° Entrega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">Fecha Entrega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">Cant. Pedidos</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">Empresaria / Cédula</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">Usuario</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-monchito-purple py-4 px-6 text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-8 w-8 border-4 border-slate-100 border-t-monchito-purple rounded-full animate-spin" />
                                        <span className="font-bold text-slate-400 text-[11px]">Cargando historial...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : batches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <History className="h-12 w-12 opacity-20" />
                                        <p className="font-black uppercase tracking-widest text-[11px]">No se encontraron entregas</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            batches.map((batch: any) => (
                                <React.Fragment key={batch.id}>
                                    <TableRow 
                                        key={batch.id} 
                                        onClick={() => toggleRow(batch.id)}
                                        className={cn(
                                            "transition-all duration-200 border-monchito-purple/5 cursor-pointer group",
                                            expandedRows.has(batch.id) ? "bg-monchito-purple/5" : "hover:bg-monchito-purple/5"
                                        )}
                                    >
                                        <TableCell className="py-4 px-6 text-center">
                                            <span className="bg-monchito-purple/10 px-3 py-1.5 rounded-lg text-xs font-black text-monchito-purple shadow-sm">
                                                {batch.deliveryNumber || 'S/N'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-700 py-4 px-6 text-xs text-center">
                                            {formatDate(batch.deliveryDate)}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center text-xs">
                                            <div className="font-black text-slate-800">{batch.orders?.length || 0}</div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center text-xs">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="font-bold text-slate-700 uppercase truncate max-w-[250px]">
                                                    {batch.orders?.[0]?.clientName || 'S/N'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-black tracking-widest">
                                                    {batch.orders?.[0]?.client?.identificationNumber || batch.orders?.[0]?.clientIdentification || batch.orders?.[0]?.clientIdentificationNumber || 'S/ID'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {batch.deliveredByName || 'S/N'}
                                        </TableCell>
                                        <TableCell className="text-center py-4 px-6">
                                            <div className="flex justify-center gap-2 items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-8 w-8 rounded-full transition-all duration-300",
                                                        expandedRows.has(batch.id) ? "bg-monchito-purple text-white rotate-180" : "text-monchito-purple hover:bg-monchito-purple/10"
                                                    )}
                                                >
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                                <div className="w-[1px] h-4 bg-slate-100 mx-1" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReverseDelivery(batch);
                                                    }}
                                                    title="Eliminar Entrega y Reversar Saldo"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-monchito-purple hover:bg-monchito-purple/10 rounded-full transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePrintPreview(batch);
                                                    }}
                                                    disabled={!batch.orders?.length}
                                                    title="Reimprimir Comprobante de Entrega"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(batch.id) && (
                                        <TableRow className="bg-slate-50/40 hover:bg-slate-50/40 border-none">
                                            <TableCell colSpan={6} className="py-2 px-10">
                                                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-monchito-purple/10 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="bg-monchito-purple/5 px-4 py-2 border-b border-monchito-purple/5 flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-monchito-purple/60 uppercase tracking-widest">Pedidos entregados en este lote</span>
                                                        <span className="text-[9px] font-black text-monchito-purple">{batch.orders?.length} ítems</span>
                                                    </div>
                                                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {batch.orders?.map((o: any) => (
                                                            <div key={o.id} className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 bg-white hover:border-monchito-purple/20 transition-all duration-200 group/item">
                                                                <div className="h-8 w-8 rounded-lg bg-monchito-purple/5 flex items-center justify-center text-monchito-purple text-[10px] font-black group-hover/item:scale-110 transition-transform">
                                                                    {o.id.slice(-2).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 flex flex-col gap-0.5">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[10px] font-black text-slate-700">{o.receiptNumber}</span>
                                                                        <span className="text-[8px] font-black text-monchito-purple bg-monchito-purple/5 px-1.5 py-0.5 rounded uppercase tracking-tighter">{(o as any).brand?.name || 'S/N'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                                                                        <span>{o.orderNumber || 'S/N'}</span>
                                                                        <span className="font-black text-slate-600">${Number(o.realInvoiceTotal || o.total).toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
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
