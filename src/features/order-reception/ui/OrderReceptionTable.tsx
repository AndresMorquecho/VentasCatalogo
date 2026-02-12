import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { PackageCheck } from "lucide-react"
import type { Order } from "@/entities/order/model/types"

interface OrderReceptionTableProps {
    orders: Order[]
    onReceive: (order: Order) => void
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-EC', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

function formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
}

export function OrderReceptionTable({ orders, onReceive }: OrderReceptionTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>N° Recibo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Valor Estimado</TableHead>
                        <TableHead className="text-right">Abonado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No hay pedidos pendientes de recepción.
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{formatDate(order.createdAt)}</TableCell>
                                <TableCell className="font-medium">{order.receiptNumber}</TableCell>
                                <TableCell>{order.clientName}</TableCell>
                                <TableCell>{order.brandName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(order.paidAmount)}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="bg-amber-600 hover:bg-amber-700 text-white"
                                        onClick={() => onReceive(order)}
                                    >
                                        <PackageCheck className="mr-2 h-3.5 w-3.5" />
                                        Recibir
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
