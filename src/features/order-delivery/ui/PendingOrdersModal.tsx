import { useState, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { useQuery } from "@tanstack/react-query"
import { orderApi } from "@/entities/order"
import { getPaidAmount } from "@/entities/order/model/model"
import { Search, Loader2, PackageOpen } from "lucide-react"
import { Input } from "@/shared/ui/input"

interface PendingOrdersModalProps {
    isOpen: boolean
    onClose: () => void
    clientId: string
    clientName: string
}

export function PendingOrdersModal({ isOpen, onClose, clientId, clientName }: PendingOrdersModalProps) {
    const [searchTerm, setSearchTerm] = useState("")

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders', 'pending-reception', clientId],
        queryFn: async () => {
            const response = await orderApi.getAll({
                clientId,
                status: 'POR_RECIBIR',
                limit: 100
            })
            return response.data
        },
        enabled: isOpen && !!clientId
    })

    const filteredOrders = useMemo(() => {
        if (!orders) return []
        if (!searchTerm) return orders
        const lowerSearch = searchTerm.toLowerCase()
        return orders.filter(o => 
            o.receiptNumber.toLowerCase().includes(lowerSearch) ||
            (o.orderNumber || "").toLowerCase().includes(lowerSearch) ||
            o.brandName.toLowerCase().includes(lowerSearch)
        )
    }, [orders, searchTerm])

    const totalAmount = useMemo(() => 
        filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    , [filteredOrders])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl bg-white rounded-2xl p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 bg-monchito-purple/5 border-b border-monchito-purple/10">
                    <DialogTitle className="flex items-center gap-3 text-monchito-purple">
                        <div className="bg-monchito-purple/10 p-2 rounded-xl">
                            <PackageOpen className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black uppercase tracking-tight">Pedidos por Ingresar</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Empresaria: {clientName}</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Filter bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Buscar por recibo, catálogo o N° de pedido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:ring-monchito-purple/20"
                        />
                    </div>

                    {/* Table Zone */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="max-h-[450px] overflow-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow className="border-b border-slate-200">
                                        <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Recibo</TableHead>
                                        <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">N° de Pedido</TableHead>
                                        <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Tipo</TableHead>
                                        <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Catálogo</TableHead>
                                        <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Valor Pedido</TableHead>
                                        <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Abono</TableHead>
                                        <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Fecha Posible Entrega</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-40 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Loader2 className="h-8 w-8 animate-spin" />
                                                    <span className="text-sm font-bold">Cargando pedidos...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-40 text-center text-slate-400 italic font-medium">
                                                No se encontraron pedidos pendientes para ingresar.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map(order => {
                                            const paid = getPaidAmount(order)
                                            return (
                                                <TableRow key={order.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                                                    <TableCell className="text-center py-3 text-xs font-mono font-bold text-slate-700">#{order.receiptNumber}</TableCell>
                                                    <TableCell className="text-center py-3 text-xs font-mono text-slate-600">{order.orderNumber || '---'}</TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                                                            order.type === 'CAMBIO' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                            order.type === 'PREVENTA' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                        }`}>
                                                            {order.type}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center py-3 text-xs font-black text-monchito-purple uppercase tracking-tight">{order.brandName}</TableCell>
                                                    <TableCell className="text-center py-3 text-xs font-mono font-black text-slate-800">${order.total.toFixed(2)}</TableCell>
                                                    <TableCell className="text-center py-3 text-xs font-mono font-black text-emerald-600">${paid.toFixed(2)}</TableCell>
                                                    <TableCell className="text-center py-3 text-xs font-bold text-slate-500 italic">
                                                        {order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toLocaleDateString() : '---'}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Footer Sum */}
                {!isLoading && filteredOrders.length > 0 && (
                    <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-10 pr-12 rounded-b-2xl">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pedidos</span>
                            <span className="text-2xl font-mono font-black text-slate-800">${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
