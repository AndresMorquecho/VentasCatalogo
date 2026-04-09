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
import { Search, PackageOpen, LayoutList } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Pagination } from "@/shared/ui/pagination"

interface PendingOrdersModalProps {
    isOpen: boolean
    onClose: () => void
    clientId: string
    clientName: string
}

export function PendingOrdersModal({ isOpen, onClose, clientId, clientName }: PendingOrdersModalProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const { data: response, isLoading } = useQuery({
        queryKey: ['orders', 'pending-reception', clientId, page, limit, searchTerm],
        queryFn: async () => {
            const res = await orderApi.getAll({
                clientId,
                status: 'POR_RECIBIR',
                page,
                limit,
                search: searchTerm
            })
            return res
        },
        enabled: isOpen && !!clientId
    })

    const orders = response?.data || []
    const pagination = response?.pagination

    const totalAmount = useMemo(() => 
        orders.reduce((sum, o) => sum + (o.total || 0), 0)
    , [orders])

    // Reset page when search changes
    const handleSearchChange = (val: string) => {
        setSearchTerm(val)
        setPage(1)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[90vh] bg-white rounded-3xl p-0 overflow-hidden shadow-2xl flex flex-col border-none">
                {/* Header */}
                <DialogHeader className="p-6 bg-monchito-purple/5 border-b border-monchito-purple/10 shrink-0">
                    <DialogTitle className="flex items-center justify-between gap-3 text-monchito-purple">
                        <div className="flex items-center gap-3">
                            <div className="bg-monchito-purple/10 p-2.5 rounded-2xl shadow-sm">
                                <PackageOpen className="h-6 w-6 text-monchito-purple" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black uppercase tracking-tight text-slate-800">Caja de Pedidos</span>
                                <span className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-widest flex items-center gap-1.5">
                                    <LayoutList className="h-3 w-3" />
                                    Empresaria: {clientName}
                                </span>
                            </div>
                        </div>

                        {/* Quick Summary in Header */}
                        {pagination && (
                            <div className="hidden sm:flex items-center gap-4 bg-white/50 border border-monchito-purple/10 px-4 py-2 rounded-2xl">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registros</p>
                                    <p className="text-sm font-black text-monchito-purple">{pagination.total}</p>
                                </div>
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Search Bar Area */}
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
                    <div className="relative group max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-monchito-purple transition-colors" />
                        <Input 
                            placeholder="Buscar por recibo, catálogo o N° de pedido..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-monchito-purple/10 transition-all font-medium shadow-sm hover:border-monchito-purple/30"
                        />
                    </div>
                </div>

                {/* Table Zone - Scrollable */}
                <div className="flex-1 overflow-auto px-6 py-4 custom-scrollbar bg-white">
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <Table className="border-collapse">
                            <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                    <TableHead className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">N° Recibo</TableHead>
                                    <TableHead className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">N° Pedido (Físico)</TableHead>
                                    <TableHead className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Tipo</TableHead>
                                    <TableHead className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Catálogo</TableHead>
                                    <TableHead className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Valor Total</TableHead>
                                    <TableHead className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Abono Inicial</TableHead>
                                    <TableHead className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Fecha Entrega</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-300">
                                                <div className="h-10 w-10 border-4 border-monchito-purple/20 border-t-monchito-purple rounded-full animate-spin" />
                                                <span className="text-xs font-black uppercase tracking-tighter">Sincronizando Pedidos...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <div className="bg-slate-50 p-4 rounded-full mb-2">
                                                    <LayoutList className="h-8 w-8 text-slate-200" />
                                                </div>
                                                <p className="font-bold text-sm tracking-tight text-slate-500">No hay pedidos registrados</p>
                                                <p className="text-xs opacity-60">Los pedidos listos para ingresar aparecerán aquí</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map(order => {
                                        const paid = getPaidAmount(order)
                                        return (
                                            <TableRow key={order.id} className="group hover:bg-monchito-purple/[0.02] transition-colors border-b border-slate-50 last:border-0">
                                                <TableCell className="text-center py-4">
                                                    <span className="bg-monchito-purple/5 text-monchito-purple px-2.5 py-1 rounded-lg text-[10px] font-black font-mono shadow-sm">
                                                        #{order.receiptNumber}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <span className="text-[11px] font-mono font-bold text-slate-600">
                                                        {order.orderNumber || '---'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tight shadow-sm transition-all group-hover:scale-105 ${
                                                        order.type === 'CAMBIO' ? 'bg-orange-50 text-orange-600 border-orange-100 shadow-orange-100/50' :
                                                        order.type === 'PREVENTA' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/50' :
                                                        'bg-monchito-purple/5 text-monchito-purple border-monchito-purple/10 shadow-monchito-purple/10'
                                                    }`}>
                                                        {order.type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight group-hover:text-monchito-purple transition-colors">
                                                        {order.brandName}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <span className="text-[11px] font-mono font-black text-slate-800">
                                                        ${order.total.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <span className="text-[11px] font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                        ${paid.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[11px] font-bold text-slate-500 italic">
                                                            {order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toLocaleDateString() : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer - Standardized Pagination & Summary */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-8">
                    {/* Pagination Contol */}
                    <div className="flex-1">
                        {pagination && pagination.pages > 1 && (
                            <Pagination
                                currentPage={page}
                                totalPages={pagination.pages}
                                onPageChange={setPage}
                                totalItems={pagination.total}
                                itemsPerPage={limit}
                            />
                        )}
                    </div>

                    {/* Financial Summary */}
                    {!isLoading && orders.length > 0 && (
                        <div className="flex items-center gap-6 divide-x divide-slate-200">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Página</span>
                                <span className="text-xl font-mono font-black text-monchito-purple tracking-tighter">${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
