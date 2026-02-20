// ... imports
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { Truck, CreditCard, Gift } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { inventoryApi } from "@/shared/api/inventoryApi"
import { rewardsApi } from "@/entities/client-reward/api/rewardsApi"
import { getPendingAmount, hasClientCredit, getClientCreditAmount, getPaidAmount } from "@/entities/order/model/model"
import { useAddOrderPayment } from "@/features/order-payments/model"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { processPaymentRegistration } from "@/features/transactions/lib/processPayment"
import { useToast } from "@/shared/ui/use-toast"
import { generateDeliveryReceipt } from "../lib/generateDeliveryReceipt"

interface DeliverOrderModalProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeliverOrderModal({ order, open, onOpenChange }: DeliverOrderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedBankId, setSelectedBankId] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState("EFECTIVO")
    const [referenceNumber, setReferenceNumber] = useState("")

    const qc = useQueryClient()
    const { mutateAsync: addPayment } = useAddOrderPayment()
    const { data: bankAccounts = [] } = useBankAccountList()
    const { showToast } = useToast()

    if (!order) return null

    // Use domain functions for accurate calculation
    const effectiveTotal = order.realInvoiceTotal ?? order.total
    const paid = getPaidAmount(order) // Use function instead of field
    const pendingAmount = getPendingAmount(order)
    const hasCredit = hasClientCredit(order)
    const creditAmount = getClientCreditAmount(order)
    
    // For payment: only charge if there's actual debt
    const amountToCharge = Math.max(0, pendingAmount)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // TODO BACKEND: Validate order status before delivery
            // Prevent double delivery
            if (order.status === 'ENTREGADO') {
                showToast("Este pedido ya fue entregado anteriormente", "error")
                setIsSubmitting(false)
                return
            }

            // Validate order is in warehouse
            if (order.status !== 'RECIBIDO_EN_BODEGA') {
                showToast("El pedido debe estar recibido en bodega antes de entregar", "error")
                setIsSubmitting(false)
                return
            }

            // 1. Process Payment if pending amount exists (no credit)
            if (amountToCharge > 0.01) {
                // Validation
                if (paymentMethod !== 'EFECTIVO' && !referenceNumber) {
                    showToast("Debe ingresar el número de referencia", "error")
                    setIsSubmitting(false)
                    return
                }

                if (!selectedBankId && paymentMethod !== 'EFECTIVO') {
                    showToast("Seleccione una cuenta bancaria", "error")
                    setIsSubmitting(false)
                    return
                }

                // Transaction Registration
                try {
                    const txResult = await processPaymentRegistration({
                        amount: amountToCharge,
                        method: paymentMethod,
                        reference: referenceNumber,
                        clientId: order.clientId,
                        currentPendingBalance: amountToCharge,
                        date: new Date().toISOString(),
                        user: 'Vendedor' // Mock
                    })

                    if (txResult.creditGenerated > 0) {
                        showToast(`Se generó un saldo a favor de ${txResult.creditGenerated.toFixed(2)}`, "success")
                    }
                } catch (txError: any) {
                    showToast(txError.message, "error")
                    setIsSubmitting(false)
                    return
                }

                // Find bank account
                let bankAccount = bankAccounts.find(b => b.id === selectedBankId)
                if (!bankAccount && paymentMethod === 'EFECTIVO') {
                    bankAccount = bankAccounts.find(b => b.type === 'CASH')
                }

                if (!bankAccount) {
                    showToast("Advertencia: No se encontró cuenta de caja/banco.", "error")
                } else {
                    // Register Payment in Order
                    await addPayment({
                        order,
                        amount: amountToCharge,
                        bankAccount
                    })
                }
            }

            // 2. Mark as Delivered using the updated order state
            const deliveredOrder: Order = {
                ...order,
                status: 'ENTREGADO',
                deliveryDate: new Date().toISOString(),
                // REMOVED: paidAmount update - calculated dynamically
            }

            await orderApi.update(deliveredOrder.id, deliveredOrder);

            // 3. Create Inventory Exit Movement
            // TODO BACKEND: Validate no duplicate DELIVERED exists for this order
            const existingInventory = await inventoryApi.getAll();
            const hasDelivered = existingInventory.some(
                inv => inv.orderId === deliveredOrder.id && inv.type === 'DELIVERED'
            );
            
            if (!hasDelivered) {
                await inventoryApi.create({
                    orderId: deliveredOrder.id,
                    clientId: deliveredOrder.clientId,
                    brandId: deliveredOrder.brandId,
                    type: 'DELIVERED',
                    createdBy: 'Vendedor', // Should be dynamic user
                    notes: `Salida por entrega al cliente. Pedido: ${deliveredOrder.receiptNumber}`,
                    deliveryDetails: {
                        deliveryDate: deliveredOrder.deliveryDate
                    }
                });
            } else {
                console.warn(`Inventory DELIVERED already exists for order ${deliveredOrder.id}, skipping creation`);
            }

            // 4. Update Client Rewards (Loyalty Points)
            try {
                await rewardsApi.updateClientRewards(deliveredOrder);
            } catch (rewardError) {
                console.error("Error updating rewards:", rewardError);
                // Don't fail delivery if rewards update fails
            }

            await qc.invalidateQueries({ queryKey: ['orders'] })
            await qc.invalidateQueries({ queryKey: ['financial-movements'] })
            await qc.invalidateQueries({ queryKey: ['transactions'] })
            await qc.invalidateQueries({ queryKey: ['inventory-movements'] })
            await qc.invalidateQueries({ queryKey: ['client-rewards'] })

            if (hasCredit) {
                showToast(`Entrega registrada. Cliente tiene saldo a favor de $${creditAmount.toFixed(2)}`, "success")
            } else {
                showToast("Entrega registrada correctamente", "success")
            }

            // Generate Receipt
            try {
                await generateDeliveryReceipt(deliveredOrder, {
                    amountPaidNow: amountToCharge > 0.01 ? amountToCharge : 0,
                    method: paymentMethod,
                    user: 'Vendedor' // Should be logged user
                })
            } catch (pdfError) {
                console.error("Error PDF", pdfError)
                showToast("Entrega guardada, pero error al generar PDF", "warning")
            }

            onOpenChange(false)
        } catch (error) {
            console.error("Error processing delivery:", error)
            showToast("Ocurrió un error al procesar la entrega.", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (val: number) => `$${val.toFixed(2)}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-700">
                        <Truck className="h-5 w-5" />
                        Entrega Final al Cliente
                    </DialogTitle>
                    <DialogDescription>
                        Pedido #{order.receiptNumber} - {order.clientName}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor Total (Factura Real):</span>
                            <span className="font-medium">{formatCurrency(effectiveTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Pagado:</span>
                            <span className="font-medium text-green-600">{formatCurrency(paid)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-2 border-t">
                            <span>Saldo Pendiente:</span>
                            <span className={amountToCharge > 0.01 ? "text-red-600" : "text-slate-600"}>
                                {formatCurrency(amountToCharge)}
                            </span>
                        </div>
                        {hasCredit && (
                            <div className="flex justify-between text-sm bg-emerald-50 -mx-4 -mb-4 mt-2 p-3 rounded-b-lg border-t border-emerald-200">
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                    <Gift className="h-4 w-4" />
                                    Saldo a Favor del Cliente:
                                </span>
                                <span className="font-bold text-emerald-700">{formatCurrency(creditAmount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Payment History */}
                    {order.payments && order.payments.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">Historial de Pagos</h4>
                            <div className="space-y-1">
                                {order.payments.map((payment, idx) => (
                                    <div key={payment.id} className="flex justify-between text-xs text-blue-800">
                                        <span>
                                            {idx === 0 ? '📝 Abono inicial' : '💵 Abono posterior'} 
                                            {payment.method && ` (${payment.method})`}
                                            {payment.createdAt && ` - ${new Date(payment.createdAt).toLocaleDateString('es-EC')}`}
                                        </span>
                                        <span className="font-mono font-medium">${payment.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {amountToCharge > 0.01 ? (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3">
                            <div className="flex items-start gap-2 text-amber-800">
                                <CreditCard className="h-5 w-5 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm">Cobro Obligatorio</h4>
                                    <p className="text-xs text-amber-700 leading-tight mt-1">
                                        El pedido tiene saldo pendiente. Debe registrar el cobro total ({formatCurrency(amountToCharge)}) para completar la entrega.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 pt-2">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-amber-800">Método de Pago</Label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-amber-200 bg-white px-3 py-1 text-sm"
                                    >
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="DEPOSITO">Depósito</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>

                                {paymentMethod !== 'EFECTIVO' && (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-amber-800">Cuenta de Destino</Label>
                                            <select
                                                value={selectedBankId}
                                                onChange={(e) => setSelectedBankId(e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-amber-200 bg-white px-3 py-1 text-sm"
                                            >
                                                <option value="">Seleccione cuenta...</option>
                                                {bankAccounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.bankName} - {account.holderName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-amber-800">
                                                {paymentMethod === 'CHEQUE' ? 'N° Cheque' : 'Referencia / Comprobante'}
                                            </Label>
                                            <Input
                                                value={referenceNumber}
                                                onChange={(e) => setReferenceNumber(e.target.value)}
                                                placeholder="últimos dígitos..."
                                                className="h-9 bg-white border-amber-200"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : hasCredit ? (
                        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                            <Gift className="h-4 w-4" />
                            <AlertTitle>Cliente con Saldo a Favor</AlertTitle>
                            <AlertDescription>
                                El cliente tiene un saldo a favor de {formatCurrency(creditAmount)}. Puede proceder con la entrega sin cobros adicionales. El crédito quedará disponible para futuros pedidos.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                            <Truck className="h-4 w-4" />
                            <AlertTitle>Listo para Entregar</AlertTitle>
                            <AlertDescription>
                                El pedido está pagado en su totalidad. Puede proceder con la entrega sin cobros adicionales.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (amountToCharge > 0.01 && paymentMethod !== 'EFECTIVO' && !selectedBankId)}
                        className={amountToCharge > 0.01 ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                    >
                        {isSubmitting ? 'Procesando...' : (amountToCharge > 0.01 ? 'Cobrar y Entregar' : 'Confirmar Entrega')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
