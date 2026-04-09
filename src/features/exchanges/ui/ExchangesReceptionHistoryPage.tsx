import { useState, useMemo } from "react"
import { 
    Search, 
    History, 
    ArrowLeft, 
    Calendar,
    LayoutList,
    User,
    ClipboardList,
    Printer,
    Pencil,
    Trash2,
    Lock,
    AlertTriangle,
    Send,
} from "lucide-react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { PageHeader } from "@/shared/ui/PageHeader"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { orderApi } from "@/entities/order"
import { format } from "date-fns"
import { useAuth } from "@/shared/auth"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { prepareExchangeReceiptForPreview } from "../lib/prepareExchangeReceiptForPreview"
import { useNotifications } from "@/shared/lib/notifications"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shared/ui/accordion"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { OrderStatusBadge } from "@/features/order-management/ui/OrderStatusBadge"
import { Pagination } from "@/shared/ui/pagination"

export function ExchangesReceptionHistoryPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const limit = 15;

    const { 
        closePreview, 
        isOpen, 
        pdfDocument, 
        downloadPDF, 
        printPDF,
        openPreview
    } = usePDFPreview({ fileName: 'recibo-cambio.pdf' });

    const [pdfTitle, setPdfTitle] = useState("Recibo de Cambio");
    const [pdfFileName, setPdfFileName] = useState("recibo-cambio.pdf");
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; receipt: string; ordersCount: number; blockedCount: number; blockReason: string | null }>(
        { open: false, receipt: '', ordersCount: 0, blockedCount: 0, blockReason: null }
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();
    const { notifySuccess, notifyError } = useNotifications();

    // Helper: determine if a group can be edited/deleted and why
    const getGroupRestrictions = (orders: any[]) => {
        const BLOCKED = ['RECIBIDO_EN_BODEGA', 'ENTREGADO'];
        const IN_TRANSIT = ['EN_TRANSITO'];
        const blockedOrders = orders.filter(o => BLOCKED.includes(o.status));
        const inTransitOrders = orders.filter(o => IN_TRANSIT.includes(o.status));
        const withGuide = orders.filter(o => o.trackingGuide && !o.trackingGuide.startsWith('SN-'));
        
        const canDelete = blockedOrders.length === 0 && withGuide.length === 0;
        const canEdit = blockedOrders.length < orders.length; // Can edit if at least one order is not fully blocked
        
        let deleteBlockReason: string | null = null;
        if (blockedOrders.length > 0) deleteBlockReason = `${blockedOrders.length} pedido(s) ya fueron recibidos o entregados`;
        else if (withGuide.length > 0) deleteBlockReason = `${withGuide.length} pedido(s) están en una guía activa`;
        
        return { canDelete, canEdit, deleteBlockReason, blockedCount: blockedOrders.length + withGuide.length, inTransitCount: inTransitOrders.length };
    };

    const handleDeleteReceipt = async () => {
        setIsDeleting(true);
        try {
            await orderApi.cancelExchangeReceipt(deleteConfirm.receipt);
            notifySuccess(`Recibo ${deleteConfirm.receipt} eliminado correctamente`);
            queryClient.invalidateQueries({ queryKey: ['exchanges-receipt-history'] });
            setDeleteConfirm({ open: false, receipt: '', ordersCount: 0, blockedCount: 0, blockReason: null });
        } catch (e: any) {
            notifyError(e, e?.message || 'Error al eliminar el recibo');
        } finally {
            setIsDeleting(false);
        }
    };

    const { data: response, isLoading } = useQuery({
        queryKey: ['exchanges-receipt-history', page, searchTerm],
        queryFn: async () => {
            const res = await orderApi.getAll({
                type: 'CAMBIO',
                page,
                limit, 
                search: searchTerm,
                sortBy: 'createdAt',
                order: 'desc'
            })
            return res
        }
    })

    const allExchanges = response?.data || []
    const pagination = response?.pagination

    // Group by receiptNumber (CAM-XXXX)
    const groupedExchanges = useMemo(() => {
        const groups: Record<string, any[]> = {}
        
        allExchanges
            .filter(o => o.receiptNumber)
            .forEach(order => {
                const receipt = order.receiptNumber!
                if (!groups[receipt]) groups[receipt] = []
                groups[receipt].push(order)
            })

        // Sort groups by date (newest first)
        return Object.entries(groups).sort((a, b) => {
            const dateA = new Date(a[1][0].createdAt).getTime()
            const dateB = new Date(b[1][0].createdAt).getTime()
            return dateB - dateA
        })
    }, [allExchanges])

    return (
        <div className="space-y-6 h-full flex flex-col">
            <PageHeader
                title="Historial de Recepción de Cambios"
                description="Seguimiento de recibos de cambios generados por clientes (CAM-XXXX)"
                icon={History}
                actions={
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/exchanges')}
                        className="rounded-xl border-slate-200 font-bold"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión
                    </Button>
                }
            />

            <div className="flex flex-col gap-6 flex-1 min-h-0">
                {/* Filters */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-monchito-purple transition-colors" />
                            <input 
                                placeholder="Buscar por N° de cambio, N° manual, empresaria..." 
                                className="pl-11 h-12 bg-slate-50/50 border-transparent rounded-xl focus:ring-monchito-purple/20 transition-all font-medium text-sm w-full outline-none focus:bg-white border focus:border-monchito-purple/20"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setPage(1)
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* List Zone */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <div className="h-10 w-10 border-4 border-monchito-purple border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-bold text-slate-400">Cargando historial de cambios...</p>
                            </div>
                        ) : groupedExchanges.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                <ClipboardList className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-lg font-bold">No se encontraron recibos de cambios</p>
                                <p className="text-sm">Los recibos CAM-XXXX aparecerán aquí</p>
                            </div>
                        ) : (
                            <Accordion type="multiple" className="w-full">
                                {groupedExchanges.map(([receipt, orders]) => {
                                    const firstOrder = orders[0]
                                    const clientName = firstOrder.clientName
                                    const date = firstOrder.createdAt
                                    const totalItems = orders.length
                                    const totalValue = orders.reduce((sum, o) => sum + Number(o.total), 0)
                                    const { canDelete, canEdit, deleteBlockReason, blockedCount, inTransitCount } = getGroupRestrictions(orders)

                                    return (
                                        <AccordionItem key={receipt} value={receipt} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                                            <AccordionTrigger className="px-6 py-5 hover:no-underline group">
                                                <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center justify-between gap-4 mr-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-monchito-purple/10 p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                                            <ClipboardList className="h-5 w-5 text-monchito-purple" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Recibo de Cambio</p>
                                                            <h3 className="text-base font-black text-monchito-purple tracking-tight">{receipt}</h3>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-8">
                                                        <div className="hidden lg:flex items-center gap-3">
                                                            <div className="bg-slate-100 p-2 rounded-full">
                                                                <User className="h-3 w-3 text-slate-500" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Empresaria</p>
                                                                <p className="text-xs font-bold text-slate-700 uppercase">{clientName}</p>
                                                            </div>
                                                        </div>

                                                        <div className="hidden md:flex flex-col items-end">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fecha Registro</p>
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-600">
                                                                <Calendar className="h-3 w-3" />
                                                                <span className="text-[11px]">{format(new Date(date), 'dd/MM/yyyy HH:mm')}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-end min-w-[80px]">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Cambio</p>
                                                            <span className="text-sm font-mono font-black text-emerald-600">${totalValue.toFixed(2)}</span>
                                                                                                                 <div className="flex items-center gap-2">
                                                            <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                                <LayoutList className="h-3 w-3 text-slate-400" />
                                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-tighter">{totalItems} ITEMS</span>
                                                            </div>

                                                            {/* Editar */}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                title={canEdit ? `Editar ${receipt}` : 'No se puede editar: todos los pedidos están bloqueados'}
                                                                className={`h-8 w-8 p-0 rounded-lg transition-colors ${canEdit ? 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300' : 'opacity-40 cursor-not-allowed'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (canEdit) navigate(`/exchanges/group/${encodeURIComponent(receipt)}`);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>

                                                            {/* Eliminar */}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                title={canDelete ? `Eliminar ${receipt}` : deleteBlockReason || 'No se puede eliminar'}
                                                                className={`h-8 w-8 p-0 rounded-lg transition-colors ${canDelete ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-300' : 'opacity-40 cursor-not-allowed'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (canDelete) {
                                                                        setDeleteConfirm({ open: true, receipt, ordersCount: orders.length, blockedCount: 0, blockReason: null });
                                                                    }
                                                                }}
                                                            >
                                                                {canDelete ? <Trash2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                            </Button>

                                                            {/* Imprimir PDF */}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 rounded-lg hover:bg-monchito-purple hover:text-white transition-colors"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const { document, fileName, title } = await prepareExchangeReceiptForPreview(
                                                                            orders,
                                                                            user as any,
                                                                            receipt
                                                                        );
                                                                        setPdfFileName(fileName);
                                                                        setPdfTitle(title);
                                                                        openPreview(document);
                                                                    } catch (err) {
                                                                        console.error("Error generating PDF", err);
                                                                    }
                                                                }}
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>

                                                            {/* Badges de estado */}
                                                            {inTransitCount > 0 && (
                                                                <span className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-black uppercase px-2 py-1 rounded-full">
                                                                    <Send className="h-2.5 w-2.5" /> {inTransitCount} en tránsito
                                                                </span>
                                                            )}
                                                            {blockedCount > 0 && (
                                                                <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-[9px] font-black uppercase px-2 py-1 rounded-full">
                                                                    <Lock className="h-2.5 w-2.5" /> {blockedCount} bloqueados
                                                                </span>
                                                            )}
                                                        </div>
 </div>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-0 pt-0 pb-6 bg-slate-50/50 animate-in fade-in duration-300">
                                                <div className="px-4 overflow-x-auto">
                                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-[1400px] mb-4">
                                                        <Table>
                                                            <TableHeader className="bg-slate-50">
                                                                <TableRow>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-12">N</TableHead>
                                                                    <TableHead className="font-black text-[10px] uppercase tracking-widest min-w-[150px]">Empresaria</TableHead>
                                                                    <TableHead className="font-black text-[10px] uppercase tracking-widest w-[100px]">Catálogo</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[120px]">N° Cambio M.</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[60px]">Cant. E</TableHead>
                                                                    <TableHead className="font-black text-[10px] uppercase tracking-widest min-w-[200px]">Descrip. Se Va</TableHead>
                                                                    <TableHead className="font-black text-[10px] uppercase tracking-widest min-w-[200px]">Descrip. Viene</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[60px]">Cant. R</TableHead>
                                                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest w-[90px]">Valor</TableHead>
                                                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest w-[90px]">Abonado</TableHead>
                                                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest w-[90px]">Saldo</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[120px]">P. Entrega</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[110px]">Estado</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {orders.map((order, idx) => {
                                                                    const paid = (order as any).paidAmount || 0;
                                                                    const pending = Number(order.total) - paid;
                                                                    
                                                                    return (
                                                                        <TableRow key={order.id} className="hover:bg-slate-50/50">
                                                                            <TableCell className="text-center text-slate-400 font-bold">{idx + 1}</TableCell>
                                                                            <TableCell className="font-bold text-slate-800 uppercase text-[10px]">{order.clientName}</TableCell>
                                                                            <TableCell className="font-bold text-monchito-purple uppercase text-[10px]">{order.brandName}</TableCell>
                                                                            <TableCell className="text-center font-mono font-black text-slate-500 text-[10px]">{order.sourceOrderNumber || '---'}</TableCell>
                                                                            <TableCell className="text-center font-black text-slate-600 text-[10px]">{order.sourceQuantity || 1}</TableCell>
                                                                            <TableCell className="text-[10px] text-slate-500 italic max-w-[200px] truncate">{order.sourceDescription || '---'}</TableCell>
                                                                            <TableCell className="text-[10px] text-monchito-purple font-medium max-w-[200px] truncate">{order.description || '---'}</TableCell>
                                                                            <TableCell className="text-center font-black text-slate-600 text-[10px]">{order.items?.[0]?.quantity || 1}</TableCell>
                                                                            <TableCell className="text-right font-mono font-bold text-slate-600 text-[10px]">${Number(order.total).toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right font-mono font-bold text-emerald-600 text-[10px]">${Number(paid).toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right font-mono font-bold text-red-500 text-[10px]">${Number(pending).toFixed(2)}</TableCell>
                                                                            <TableCell className="text-center text-slate-600 font-bold text-[10px]">
                                                                                {order.possibleDeliveryDate ? format(new Date(order.possibleDeliveryDate), 'dd/MM/yyyy') : '---'}
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <OrderStatusBadge status={order.status} />
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        )}
                    </div>
                    
                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
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
            </div>
            
            <PDFPreviewModal 
                open={isOpen} 
                onOpenChange={(open: boolean) => !open && closePreview()}
                title={pdfTitle}
                pdfDocument={pdfDocument || <></>}
                fileName={pdfFileName}
                onDownload={() => downloadPDF()}
                onPrint={() => printPDF()}
            />

            {/* Delete Confirmation Dialog */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-3 rounded-xl">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-base">Eliminar Recibo de Cambio</h3>
                                <p className="text-[11px] text-slate-500">Esta acción es irreversible</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                            ¿Estás seguro de eliminar el recibo <span className="font-black text-monchito-purple">{deleteConfirm.receipt}</span>?
                        </p>
                        <p className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3 mb-5">
                            Se cancelarán <strong>{deleteConfirm.ordersCount} pedido(s)</strong> y se revertirán todos los abonos de su cuenta bancaria correspondiente.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, receipt: '', ordersCount: 0, blockedCount: 0, blockReason: null })} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                                onClick={handleDeleteReceipt}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Eliminando...' : 'Sí, eliminar recibo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
