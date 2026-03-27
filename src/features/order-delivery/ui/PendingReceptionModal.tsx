import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { useOrderDeliveryList } from "../model/useOrderDelivery"
import { getPaidAmount } from "@/entities/order/model/model"
import { Loader2, PackageSearch } from "lucide-react"

interface PendingReceptionModalProps {
    clientId: string
    clientName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PendingReceptionModal({ 
    clientId, 
    clientName, 
    open, 
    onOpenChange 
}: PendingReceptionModalProps) {
    const { data: response, isLoading } = useOrderDeliveryList({
        clientId,
        status: 'POR_RECIBIR',
        enabled: open && !!clientId,
        limit: 100
    })

    const orders = response?.data || []

    const formatDate = (date: string) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('es-EC', {
            year: 'numeric', month: 'short', day: 'numeric'
        })
    }

    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
                <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-monchito-purple/5 to-monchito-purple/10 border-b border-monchito-purple/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-monchito-purple p-2.5 rounded-2xl shadow-lg shadow-monchito-purple/20">
                            <PackageSearch className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                                Pedidos Por Recibir
                            </DialogTitle>
                            <p className="text-sm font-bold text-monchito-purple uppercase tracking-wider mt-0.5">
                                {clientName}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-6 bg-white">
                    {isLoading ? (
                        <div className="h-60 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <Loader2 className="h-10 w-10 animate-spin text-monchito-purple" />
                            <span className="font-bold text-sm">Consultando bodega...</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="h-60 flex flex-col items-center justify-center gap-3 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                            <PackageSearch className="h-12 w-12 text-slate-200" />
                            <p className="font-bold text-slate-500">No hay pedidos pendientes de recepción</p>
                            <p className="text-xs text-slate-400">Todos los pedidos de esta empresaria ya están en bodega o entregados.</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-4">Pedido Por</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Recibo</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresaria</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No. Pedido</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Catalogo</TableHead>
                                        <TableHead className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">V. Pedido</TableHead>
                                        <TableHead className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Abono</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Factura</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">N.C.</TableHead>
                                        <TableHead className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">V. Factura</TableHead>
                                        <TableHead className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">F. Ingreso</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => {
                                        const paidAmount = getPaidAmount(order);
                                        return (
                                            <TableRow key={order.id} className="hover:bg-monchito-purple/5 transition-colors border-b border-slate-50">
                                                <TableCell className="text-[10px] font-bold text-slate-500 text-center uppercase">{order.salesChannel}</TableCell>
                                                <TableCell className="font-mono text-[10px] font-bold text-slate-700 text-center">{order.receiptNumber}</TableCell>
                                                <TableCell className="text-[11px] font-bold text-slate-900 max-w-[150px] truncate">{order.clientName}</TableCell>
                                                <TableCell className="font-mono text-[10px] font-bold text-monchito-purple/70 text-center">{order.orderNumber || '-'}</TableCell>
                                                <TableCell className="text-[10px] font-bold text-slate-500 text-center uppercase">{order.type}</TableCell>
                                                <TableCell className="text-[10px] font-black text-monchito-purple text-center uppercase">{order.brandName}</TableCell>
                                                <TableCell className="text-right font-mono text-[11px] font-bold text-slate-700">{formatCurrency(order.total)}</TableCell>
                                                <TableCell className="text-right font-mono text-[11px] font-bold text-emerald-600">{formatCurrency(paidAmount)}</TableCell>
                                                <TableCell className="text-[10px] font-bold text-slate-700 text-center">{order.invoiceNumber || '-'}</TableCell>
                                                <TableCell className="text-[10px] font-bold text-orange-600 text-center">{order.creditNoteNumber || '-'}</TableCell>
                                                <TableCell className="text-right font-mono text-[11px] font-bold text-slate-700">
                                                    {order.realInvoiceTotal ? formatCurrency(order.realInvoiceTotal) : '-'}
                                                </TableCell>
                                                <TableCell className="text-[10px] font-bold text-slate-500 text-center">{formatDate(order.createdAt)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                    >
                        Cerrar Ventana
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
