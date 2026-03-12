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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            {/* Empty or master check if needed, but master check is tricky with "same client" constraint */}
                        </TableHead>
                        <TableHead>Fecha Recep.</TableHead>
                        <TableHead>N° Recibo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor Real</TableHead>
                        <TableHead className="text-right">Abonado</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
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

                            let rowClass = "transition-colors border-l-4 border-l-transparent hover:bg-slate-50"
                            if (days > 15) rowClass = "bg-red-50 hover:bg-red-100 border-l-red-400"
                            else if (days > 5) rowClass = "bg-amber-50 hover:bg-amber-100 border-l-amber-400"
                            else rowClass = "bg-emerald-50/50 hover:bg-emerald-50 border-l-emerald-300"
                            
                            if (isSelected) rowClass = "bg-blue-50 hover:bg-blue-100 border-l-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)]"

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
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer disabled:cursor-not-allowed opacity-70"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-medium text-slate-700">{formatDate(order.receptionDate!)}</span>
                                            {days > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] px-1.5 py-0 uppercase font-black border-transparent tracking-widest ${days > 15 ? 'bg-red-200 text-red-800' :
                                                            days > 5 ? 'bg-amber-200 text-amber-800' :
                                                                'bg-emerald-100 text-emerald-800'
                                                        }`}
                                                >
                                                    {days} {days === 1 ? 'día' : 'días'} en bodega
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{order.receiptNumber}</TableCell>
                                    <TableCell>{order.clientName}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(order.realInvoiceTotal || order.total)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600">
                                        {formatCurrency(paidAmount)}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${pendingForDisplay > 0.01 ? 'text-red-600' : 'text-slate-400'}`}>
                                        {formatCurrency(pendingForDisplay)}
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
