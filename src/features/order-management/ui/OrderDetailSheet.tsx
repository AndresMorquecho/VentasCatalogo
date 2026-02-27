import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/shared/ui/sheet"
import { Separator } from "@/shared/ui/separator"
import { OrderStatusBadge } from "./OrderStatusBadge"
import type { Order } from "@/entities/order/model/types"
import { getPaidAmount, getPendingAmount } from "@/entities/order/model/model"

interface OrderDetailSheetProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

function formatDate(dateString: string): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-EC', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

export function OrderDetailSheet({ order, open, onOpenChange }: OrderDetailSheetProps) {
    if (!order) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Detalle del Pedido</SheetTitle>
                        <OrderStatusBadge status={order.status} />
                    </div>
                    <SheetDescription>
                        Recibo N° {order.receiptNumber}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Información del Cliente */}
                    <div>
                        <h4 className="font-medium mb-2">Cliente</h4>
                        <div className="text-sm bg-muted/40 p-3 rounded-md space-y-1">
                            <p><span className="font-medium">Nombre:</span> {order.clientName}</p>
                            <p><span className="text-muted-foreground">ID Cliente: {order.clientId}</span></p>
                        </div>
                    </div>

                    <Separator />

                    {/* Información General */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">Pedido Por</p>
                            <p>{order.salesChannel}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Tipo</p>
                            <p className="capitalize">{order.type.toLowerCase()}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Marca</p>
                            <p>{order.brandName}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Fecha Pedido</p>
                            <p>{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="font-medium text-muted-foreground">Posible Entrega</p>
                            <p>{formatDate(order.possibleDeliveryDate)}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Items */}
                    <div>
                        <h4 className="font-medium mb-3">Productos ({order.items.length})</h4>
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {item.quantity} x {formatCurrency(item.unitPrice)}
                                        </p>
                                    </div>
                                    <p className="font-medium">
                                        {formatCurrency(item.quantity * item.unitPrice)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Resumen Financiero */}
                    <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Pedido</span>
                            <span className="font-medium">{formatCurrency(order.total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Pagado</span>
                            <span className="text-green-600 font-medium">-{formatCurrency(getPaidAmount(order))}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-base font-bold">
                            <span>Saldo Pendiente</span>
                            <span className="text-red-600">{formatCurrency(Math.max(0, getPendingAmount(order)))}</span>
                        </div>
                    </div>

                    {/* Notas */}
                    {order.notes && (
                        <div>
                            <h4 className="font-medium mb-2 text-sm">Notas</h4>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                {order.notes}
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
