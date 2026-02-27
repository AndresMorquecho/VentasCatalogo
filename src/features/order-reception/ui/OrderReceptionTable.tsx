import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { PackageCheck, RotateCcw } from "lucide-react" // Added RotateCcw
import type { Order } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"

interface OrderReceptionTableProps {
    orders: Order[]
    onReceive: (order: Order) => void
    onReverse?: (orderId: string) => void // Added onReverse
    isProcessing?: string | null
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-EC', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

function formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
}

export function OrderReceptionTable({ orders, onReceive, onReverse, isProcessing }: OrderReceptionTableProps) {
    return (
        <div className="rounded-md border bg-white overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
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
                                No hay pedidos para procesar en esta sección.
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => (
                            <TableRow key={order.id} className={order.status === 'RECIBIDO_EN_BODEGA' ? 'bg-blue-50/30' : ''}>
                                <TableCell>{formatDate(order.createdAt)}</TableCell>
                                <TableCell className="font-medium">{order.receiptNumber}</TableCell>
                                <TableCell>{order.clientName}</TableCell>
                                <TableCell>{order.brandName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(getPaidAmount(order))}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {order.status === 'RECIBIDO_EN_BODEGA' ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                                onClick={() => onReverse?.(order.id)}
                                                disabled={isProcessing === order.id}
                                                title="Regresar Recepción"
                                            >
                                                <RotateCcw className={`mr-2 h-3.5 w-3.5 ${isProcessing === order.id ? 'animate-spin' : ''}`} />
                                                Regresar
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                                onClick={() => onReceive(order)}
                                                disabled={isProcessing === order.id}
                                            >
                                                <PackageCheck className="mr-2 h-3.5 w-3.5" />
                                                Recibir
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
