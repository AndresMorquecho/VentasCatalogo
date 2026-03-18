import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { AlertTriangle } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { Badge } from "@/shared/ui/badge"

interface OrderDeliveryTableProps {
    orders: Order[]
    selectedOrderIds: string[]
    onSelectionChange: (ids: string[]) => void
}

function formatDate(date: string) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-EC', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

function formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
}

export function OrderDeliveryTable({ 
    orders, 
    selectedOrderIds, 
    onSelectionChange 
}: OrderDeliveryTableProps) {
    const handleToggleSelect = (order: Order) => {
        if (selectedOrderIds.includes(order.id)) {
            onSelectionChange(selectedOrderIds.filter(id => id !== order.id))
        } else {
            // Validate same client
            const firstSelectedId = selectedOrderIds[0]
            if (firstSelectedId) {
                const firstOrder = orders.find(o => o.id === firstSelectedId)
                if (firstOrder && firstOrder.clientId !== order.clientId) {
                    // This validation should ideally be handled at a higher level (toast)
                    // but we can just prevent selection here.
                    return
                }
            }
            onSelectionChange([...selectedOrderIds, order.id])
        }
    }

    const firstSelectedId = selectedOrderIds[0]
    const selectedClientId = firstSelectedId ? orders.find(o => o.id === firstSelectedId)?.clientId : null
    return (
        <div className="overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-monchito-purple/5 hover:bg-monchito-purple/5 border-b border-monchito-purple/10">
                        <TableHead className="w-[50px] text-[10px] font-black text-monchito-purple uppercase tracking-widest">
                            {/* Empty or master check if needed */}
                        </TableHead>
                        <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Fecha Recep.</TableHead>
                        <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">N° Recibo</TableHead>
                        <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Cliente</TableHead>
                        <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Valor Real</TableHead>
                        <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Abonado</TableHead>
                        <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Pendiente</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No hay pedidos listos para entrega.
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => {
                            const isSelected = selectedOrderIds.includes(order.id)
                            const isDisabled = selectedClientId !== null && order.clientId !== selectedClientId

                            // Use centralized calculator to get actual paid amount
                            const paidAmount = getPaidAmount(order);
                            const actualPending = (order.realInvoiceTotal || order.total) - paidAmount;
                            const pendingForDisplay = Math.max(0, actualPending);

                            // Calculate days in warehouse
                            const now = new Date();
                            const reception = order.receptionDate ? new Date(order.receptionDate) : new Date(order.createdAt);
                            const diffTime = now.getTime() - reception.getTime();
                            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                            let rowClass = "transition-colors hover:bg-monchito-purple/5 border-b border-slate-50"
                            if (days > 15) rowClass = "bg-red-50/50 hover:bg-red-50 border-b border-slate-50"
                            else if (days > 5) rowClass = "bg-amber-50/50 hover:bg-amber-50 border-b border-slate-50"
                            else rowClass = "bg-emerald-50/30 hover:bg-emerald-50/50 border-b border-slate-50"
                            
                            if (isSelected) rowClass = "bg-monchito-purple/10 hover:bg-monchito-purple/15 border-b border-monchito-purple/20"

                            return (
                                <TableRow 
                                    key={order.id} 
                                    className={`${rowClass} cursor-pointer`}
                                    onClick={() => !isDisabled && handleToggleSelect(order)}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            disabled={isDisabled}
                                            onChange={() => handleToggleSelect(order)}
                                            className="h-4 w-4 rounded border-slate-300 text-monchito-purple focus:ring-monchito-purple cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-medium text-xs text-slate-700">{formatDate(order.receptionDate!)}</span>
                                            {days > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] px-1.5 py-0 uppercase font-bold border-transparent tracking-wider ${days > 15 ? 'bg-red-100 text-red-700' :
                                                            days > 5 ? 'bg-amber-100 text-amber-700' :
                                                                'bg-emerald-100 text-emerald-700'
                                                        }`}
                                                >
                                                    {days} {days === 1 ? 'día' : 'días'}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs font-medium text-slate-700">{order.receiptNumber}</TableCell>
                                    <TableCell className="text-xs font-bold text-slate-900">{order.clientName}</TableCell>
                                    <TableCell className="text-right font-mono text-xs font-bold text-slate-700">
                                        ${formatCurrency(order.realInvoiceTotal || order.total)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">
                                        ${formatCurrency(paidAmount)}
                                    </TableCell>
                                    <TableCell className={`text-right font-mono text-xs font-bold ${pendingForDisplay > 0.01 ? 'text-red-600' : 'text-slate-400'}`}>
                                        ${formatCurrency(pendingForDisplay)}
                                        {pendingForDisplay > 0.01 && <AlertTriangle className="inline-block ml-1 h-3 w-3 text-red-500" />}
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
