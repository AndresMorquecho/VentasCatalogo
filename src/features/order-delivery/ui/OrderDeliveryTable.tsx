import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Truck, AlertTriangle } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"

interface OrderDeliveryTableProps {
    orders: Order[]
    onDeliver: (order: Order) => void
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

export function OrderDeliveryTable({ orders, onDeliver }: OrderDeliveryTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha Recep.</TableHead>
                        <TableHead>N° Recibo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor Real</TableHead>
                        <TableHead className="text-right">Abonado</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
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
                            // Use centralized calculator to get actual paid amount
                            const paidAmount = getPaidAmount(order);
                            const pending = (order.realInvoiceTotal || order.total) - paidAmount;

                            // Calculate days in warehouse
                            const now = new Date();
                            const reception = order.receptionDate ? new Date(order.receptionDate) : new Date(order.createdAt);
                            const diffTime = now.getTime() - reception.getTime();
                            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                            let rowClass = "transition-colors border-l-4 border-l-transparent hover:bg-slate-50"
                            if (days > 15) rowClass = "bg-red-50 hover:bg-red-100/80 border-l-red-500"
                            else if (days > 5) rowClass = "bg-amber-50 hover:bg-amber-100/80 border-l-amber-500"

                            return (
                                <TableRow key={order.id} className={rowClass}>
                                    <TableCell>
                                        {formatDate(order.receptionDate!)}
                                        {days > 0 && <span className="text-xs text-muted-foreground block">{days} días en bodega</span>}
                                    </TableCell>
                                    <TableCell className="font-medium">{order.receiptNumber}</TableCell>
                                    <TableCell>{order.clientName}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(order.realInvoiceTotal || order.total)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600">
                                        {formatCurrency(paidAmount)}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${pending > 0.01 ? 'text-red-600' : 'text-slate-400'}`}>
                                        {formatCurrency(pending)}
                                        {pending > 0.01 && <AlertTriangle className="inline-block ml-1 h-3 w-3 text-red-500" />}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => onDeliver(order)}
                                        >
                                            <Truck className="mr-2 h-3.5 w-3.5" />
                                            Entregar
                                        </Button>
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
