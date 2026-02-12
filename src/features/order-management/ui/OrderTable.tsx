import { Eye, Pencil } from "lucide-react"
import { Button } from "@/shared/ui/button"
import type { Order, OrderStatus } from "@/entities/order/model/types"
import { getPaidAmount, getPendingAmount } from "@/entities/order/model/model"
import { OrderStatusBadge } from "./OrderStatusBadge"

interface OrderTableProps {
    orders: Order[]
    onViewDetails: (order: Order) => void
    onEdit: (order: Order) => void
}

const ROW_STATUS_CLASSES: Record<OrderStatus, string> = {
    RECIBIDO: "bg-emerald-50/40 hover:bg-emerald-50/70",
    POR_RECIBIR: "bg-amber-50/40 hover:bg-amber-50/70",
    ATRASADO: "bg-red-50/40 hover:bg-red-50/70",
    CANCELADO: "bg-gray-50/40 hover:bg-gray-50/70",
    RECIBIDO_EN_BODEGA: "bg-blue-50/40 hover:bg-blue-50/70",
    ENTREGADO: "bg-slate-50/40 hover:bg-slate-50/70",
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

export function OrderTable({ orders, onViewDetails, onEdit }: OrderTableProps) {
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Pedido por</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">N° Pedido</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Tipo</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Cliente</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Marca</th>
                            <th className="text-right font-medium text-muted-foreground px-4 py-3">Valor del pedido</th>
                            <th className="text-right font-medium text-muted-foreground px-4 py-3">Abono</th>
                            <th className="text-right font-medium text-muted-foreground px-4 py-3">Saldo pendiente</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Posible entrega</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Estado</th>
                            <th className="text-center font-medium text-muted-foreground px-4 py-3 w-[100px]">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr
                                key={order.id}
                                className={`border-b last:border-b-0 transition-colors ${ROW_STATUS_CLASSES[order.status] || ""}`}
                            >
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${order.salesChannel === 'WHATSAPP'
                                        ? 'bg-green-100 text-green-800'
                                        : order.salesChannel === 'DOMICILIO'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-slate-100 text-slate-800'
                                        }`}>
                                        {order.salesChannel}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-medium">{order.receiptNumber}</td>
                                <td className="px-4 py-3 text-muted-foreground capitalize">{order.type.toLowerCase()}</td>
                                <td className="px-4 py-3 font-medium">{order.clientName}</td>
                                <td className="px-4 py-3">{order.brandName}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(getPaidAmount(order))}</td>
                                <td className="px-4 py-3 text-right font-medium text-red-600">
                                    {formatCurrency(getPendingAmount(order))}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {formatDate(order.possibleDeliveryDate)}
                                </td>
                                <td className="px-4 py-3">
                                    <OrderStatusBadge status={order.status} />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => onViewDetails(order)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">Ver</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                            onClick={() => onEdit(order)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Editar</span>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
