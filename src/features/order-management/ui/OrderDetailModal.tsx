import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { PackageCheck, Truck } from "lucide-react"
import { OrderStatusBadge } from "./OrderStatusBadge"
import type { Order } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { getPaidAmount, getPendingAmount, getEffectiveTotal, receiveOrder, deliverOrder } from "@/entities/order/model/model"
import { OrderPaymentList } from "@/features/order-payments"
import { Printer } from "lucide-react"
import { generateOrderReceipt } from "@/features/order-receipt"

interface OrderDetailModalProps {
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
    })
}

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

export function OrderDetailModal({ order, open, onOpenChange }: OrderDetailModalProps) {
    const { data: bankAccounts = [] } = useBankAccountList()
    const qc = useQueryClient()

    // State for reception flow
    const [isReceiving, setIsReceiving] = useState(false)
    const [invoiceTotal, setInvoiceTotal] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!order) return null

    const bankAccount = order.bankAccountId
        ? bankAccounts.find(b => b.id === order.bankAccountId)
        : null

    const handleReceive = async () => {
        if (!invoiceTotal) return
        const total = parseFloat(invoiceTotal)
        if (isNaN(total) || total <= 0) return

        setIsSubmitting(true)
        try {
            const updatedOrder = receiveOrder(order, total)
            await orderApi.update(updatedOrder.id, updatedOrder)
            await qc.invalidateQueries({ queryKey: ['orders'] })
            setIsReceiving(false)
            setInvoiceTotal('')
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeliver = async () => {
        if (!confirm('¿Confirmar entrega del pedido al cliente?')) return

        setIsSubmitting(true)
        try {
            const updatedOrder = deliverOrder(order)
            await orderApi.update(updatedOrder.id, updatedOrder)
            await qc.invalidateQueries({ queryKey: ['orders'] })
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) setIsReceiving(false)
            onOpenChange(v)
        }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader className="mb-4 border-b pb-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">Detalle del Pedido</DialogTitle>
                        <OrderStatusBadge status={order.status} />
                    </div>
                    <DialogDescription className="text-base mt-1">
                        Recibo N° <span className="font-mono font-bold text-foreground">{order.receiptNumber}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    {/* Columna Izquierda: Cliente y Detalles Básicos */}
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Cliente</h4>
                            <div className="bg-muted/30 p-3 rounded-md border text-sm">
                                <p className="font-semibold text-base">{order.clientName}</p>
                                <p className="text-muted-foreground">ID: {order.clientId}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block text-xs mb-1">Canal de Venta</span>
                                <span className="font-medium px-2 py-1 bg-slate-100 rounded text-slate-700 block w-fit">
                                    {order.salesChannel}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs mb-1">Tipo</span>
                                <span className="font-medium capitalize block">{order.type.toLowerCase()}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <span className="text-muted-foreground block text-xs mb-1">Fecha Posible Entrega</span>
                                <span className="font-medium text-sm border px-3 py-1.5 rounded bg-blue-50/50 text-blue-700 block">
                                    {formatDate(order.possibleDeliveryDate)}
                                </span>
                            </div>
                            {order.receptionDate && (
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Fecha Recepción Bodega</span>
                                    <span className="font-medium text-sm border px-3 py-1.5 rounded bg-amber-50/50 text-amber-700 block">
                                        {formatDate(order.receptionDate)}
                                    </span>
                                </div>
                            )}
                            {order.deliveryDate && (
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Fecha Entrega Cliente</span>
                                    <span className="font-medium text-sm border px-3 py-1.5 rounded bg-green-50/50 text-green-700 block">
                                        {formatDate(order.deliveryDate)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Producto y Financiero */}
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Producto</h4>
                            <div className="bg-muted/30 p-3 rounded-md border text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Marca:</span>
                                    <span className="font-bold">{order.brandName}</span>
                                </div>
                                {order.items?.[0] && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Cantidad:</span>
                                        <span>{order.items[0].quantity} Unidades</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Resumen Financiero</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm border-b pb-2">
                                    <span className="flex items-center gap-2">
                                        Valor Total
                                        {order.realInvoiceTotal && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase font-bold">Real</span>
                                        )}
                                        {!order.realInvoiceTotal && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-bold">Estimado</span>
                                        )}
                                    </span>
                                    <span className="font-bold text-lg">{formatCurrency(getEffectiveTotal(order))}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Pagado</span>
                                    <span className="text-green-600 font-medium">{formatCurrency(getPaidAmount(order))}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm bg-red-50 p-2 rounded text-red-700 font-bold border border-red-100">
                                    <span>Saldo Pendiente</span>
                                    <span>{formatCurrency(getPendingAmount(order))}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Detalles de Pago</h4>
                            <div className="text-sm bg-muted/30 p-3 rounded border">
                                <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground">Método:</span>
                                    <span className="font-medium">{order.paymentMethod}</span>
                                </div>

                                {order.paymentMethod === 'TRANSFERENCIA' && bankAccount && (
                                    <div className="mt-3 pt-2 border-t text-xs space-y-1">
                                        <p className="font-semibold text-muted-foreground">Cuenta Bancaria:</p>
                                        <p>Banco: {bankAccount.bankName}</p>
                                        <p>Titular: {bankAccount.holderName}</p>
                                        <p>Cuenta: {bankAccount.accountNumber}</p>
                                        {order.transactionDate && (
                                            <p className="text-muted-foreground pt-1">Fecha Transacción: {order.transactionDate}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lifecycle Actions Area */}
                {(order.status === 'POR_RECIBIR' || order.status === 'ATRASADO') && !isReceiving && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-amber-900">Recepción de Pedido</h4>
                                <p className="text-sm text-amber-700">Registrar llegada a bodega y valor real de factura</p>
                            </div>
                            <Button
                                onClick={() => {
                                    setIsReceiving(true)
                                    setInvoiceTotal(order.total.toString())
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <PackageCheck className="mr-2 h-4 w-4" />
                                Recibir Pedido
                            </Button>
                        </div>
                    </div>
                )}

                {isReceiving && (
                    <div className="bg-white border-2 border-amber-400 rounded-lg p-6 mt-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <h4 className="font-semibold text-lg mb-4 text-amber-900 flex items-center gap-2">
                            <PackageCheck className="h-5 w-5" />
                            Confirmar Recepción
                        </h4>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Valor Real de la Factura ($)</label>
                                <Input
                                    type="number"
                                    value={invoiceTotal}
                                    onChange={(e) => setInvoiceTotal(e.target.value)}
                                    placeholder="0.00"
                                    className="text-lg font-bold"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">
                                    Este valor reemplazará el estimado de {formatCurrency(order.total)} y recalculará el saldo pendiente.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setIsReceiving(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleReceive}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                    disabled={!invoiceTotal || parseFloat(invoiceTotal) <= 0 || isSubmitting}
                                >
                                    {isSubmitting ? 'Guardando...' : 'Confirmar y Actualizar Saldo'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {order.status === 'RECIBIDO_EN_BODEGA' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-green-900">Entrega Final</h4>
                                <p className="text-sm text-green-700">El pedido está listo para ser entregado al cliente</p>
                            </div>
                            <Button
                                onClick={handleDeliver}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={isSubmitting}
                            >
                                <Truck className="mr-2 h-4 w-4" />
                                Entregar Pedido
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-8 border-t pt-6">
                    <OrderPaymentList order={order} />
                </div>

                <div className="border-t pt-4 mt-6 flex justify-end">
                    <Button variant="outline" onClick={() => generateOrderReceipt(order, { id: '0', name: 'Vendedor', email: '', role: 'OPERATOR', status: 'ACTIVE', createdAt: '' } as any)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Recibo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
