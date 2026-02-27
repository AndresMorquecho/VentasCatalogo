import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { OrderStatusBadge } from "./OrderStatusBadge"
import type { Order } from "@/entities/order/model/types"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { getPaidAmount, getPendingAmount, getEffectiveTotal } from "@/entities/order/model/model"
import { OrderPaymentList } from "@/features/order-payments"
import { Printer } from "lucide-react"
import { generateOrderReceipt } from "@/features/order-receipt"
import { useAuth } from "@/shared/auth/AuthProvider"
import { useToast } from "@/shared/ui/use-toast" // Added useToast import

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
    const { user } = useAuth()
    const { showToast } = useToast() // Initialized useToast

    if (!order) return null

    const bankAccount = order.bankAccountId
        ? bankAccounts.find(b => b.id === order.bankAccountId)
        : null

    const handleGenerateReceipt = async () => {
        try {
            await generateOrderReceipt(order, {
                id: user?.id || '0',
                name: order.createdByName || user?.username || 'Administrador',
                email: '',
                role: 'OPERATOR',
                status: 'ACTIVE',
                createdAt: ''
            } as any);
            showToast("El recibo se ha generado y descargado correctamente.", "success");
        } catch (error) {
            console.error("Error generating receipt:", error);
            showToast("Hubo un problema al generar el recibo. Inténtalo de nuevo.", "error");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                                {getPendingAmount(order) > 0 && (
                                    <div className="flex justify-between items-center text-sm bg-red-50 p-2 rounded text-red-700 font-bold border border-red-100">
                                        <span>Saldo Pendiente</span>
                                        <span>{formatCurrency(Math.max(0, getPendingAmount(order)))}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Detalles de Pago Inicial</h4>
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

                <div className="mt-8 border-t pt-6">
                    <OrderPaymentList order={order} readOnly />
                </div>

                <div className="border-t pt-4 mt-6 flex justify-end">
                    <Button variant="outline" onClick={handleGenerateReceipt}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Recibo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
