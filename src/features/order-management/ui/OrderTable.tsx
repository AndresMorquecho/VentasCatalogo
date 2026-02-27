import { Eye, Pencil, Trash2, RotateCcw } from "lucide-react" // Added RotateCcw
import { Button } from "@/shared/ui/button"
import type { Order, OrderStatus } from "@/entities/order/model/types"
import { getPaidAmount, getPendingAmount } from "@/entities/order/model/model"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { useAuth } from "@/shared/auth"

interface OrderTableProps {
    orders: Order[]
    onViewDetails: (order: Order) => void
    onEdit: (order: Order) => void
    onDelete: (order: Order) => void
    onReverse?: (order: Order) => void // Added onReverse
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

export function OrderTable({ orders, onViewDetails, onEdit, onDelete, onReverse }: OrderTableProps) {
    const { hasPermission } = useAuth()

    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1200px]">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="text-left font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Pedido por</th>
                            <th className="text-left font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">N° Pedido</th>
                            <th className="text-left font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Tipo</th>
                            <th className="text-left font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Cliente</th>
                            <th className="text-left font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Marca</th>
                            <th className="text-right font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Valor del pedido</th>
                            <th className="text-right font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Abono</th>
                            <th className="text-right font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Saldo pendiente</th>
                            <th className="text-left font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Posible entrega</th>
                            <th className="text-left font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">Estado</th>
                            <th className="text-center font-medium text-muted-foreground px-2 sm:px-3 md:px-4 py-2 sm:py-3 w-[100px] text-xs sm:text-sm whitespace-nowrap">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => {
                            // Logic to determine if showing Reverse instead of Edit
                            const showReverse = order.status === 'RECIBIDO_EN_BODEGA' && !order.deliveryDate;

                            return (
                                <tr
                                    key={order.id}
                                    className={`border-b last:border-b-0 transition-colors ${ROW_STATUS_CLASSES[order.status] || ""}`}
                                >
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                                        <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${order.salesChannel === 'WHATSAPP'
                                            ? 'bg-green-100 text-green-800'
                                            : order.salesChannel === 'DOMICILIO'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {order.salesChannel}
                                        </span>
                                    </td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm whitespace-nowrap">{order.receiptNumber}</td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-muted-foreground capitalize text-xs sm:text-sm whitespace-nowrap">{order.type.toLowerCase()}</td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">{order.clientName}</td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm">{order.brandName}</td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-medium text-xs sm:text-sm whitespace-nowrap">{formatCurrency(order.total)}</td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-muted-foreground text-xs sm:text-sm whitespace-nowrap">{formatCurrency(getPaidAmount(order))}</td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-medium text-red-600 text-xs sm:text-sm whitespace-nowrap">
                                        {formatCurrency(Math.max(0, getPendingAmount(order)))}
                                    </td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                                        {formatDate(order.possibleDeliveryDate)}
                                    </td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                                        <div className="flex justify-center gap-0.5 sm:gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => onViewDetails(order)}
                                                title="Ver detalle"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Ver</span>
                                            </Button>

                                            {showReverse ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                    onClick={() => onReverse?.(order)}
                                                    title="Regresar Recepción"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                    <span className="sr-only">Regresar</span>
                                                </Button>
                                            ) : (
                                                hasPermission('orders.edit') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                                        onClick={() => onEdit(order)}
                                                        title="Editar pedido"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Button>
                                                )
                                            )}

                                            {hasPermission('orders.delete') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                                    onClick={() => onDelete(order)}
                                                    title="Eliminar pedido"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Eliminar</span>
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
