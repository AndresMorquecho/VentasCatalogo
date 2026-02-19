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
import { Truck, CreditCard } from "lucide-react" // Ensure icons imported
import type { Order } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
// import { deliverOrder } from "@/entities/order/model/model"
import { useAddOrderPayment } from "@/features/order-payments/model"
import { useBankAccountList } from "@/features/bank-account/api/hooks"
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

    // Calculate pending using local logic if util not available, strict to safe types
    const total = order.total || 0
    const paid = order.paidAmount || 0
    const pending = Math.max(0, total - paid)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // 1. Process Payment if pending amount exists
            if (pending > 0.01) {
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
                        amount: pending,
                        method: paymentMethod,
                        reference: referenceNumber,
                        clientId: order.clientId,
                        currentPendingBalance: pending,
                        date: new Date().toISOString(),
                        user: 'Vendedor' // Mock
                    })

                    if (txResult.creditGenerated > 0) {
                        showToast(`Se generó un saldo a favor de $${txResult.creditGenerated.toFixed(2)}`, "success") // use success or undefined
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
                    showToast("Advertencia: No se encontró cuenta de caja/banco.", "error") // use error for warning
                } else {
                    // Register Payment in Order
                    await addPayment({
                        order,
                        amount: pending,
                        bankAccount
                    })
                }
            }

            // 2. Mark as Delivered using the updated order state (fetched fresh or optimistic)
            const deliveredOrder: Order = {
                ...order,
                status: 'ENTREGADO',
                deliveryDate: new Date().toISOString(),
                // If payment made, update paidAmount optimistically (though addPayment updated backend)
                paidAmount: pending > 0.01 ? (order.paidAmount || 0) + pending : order.paidAmount
            }

            await orderApi.update(deliveredOrder.id, deliveredOrder)

            await qc.invalidateQueries({ queryKey: ['orders'] })
            await qc.invalidateQueries({ queryKey: ['financial-movements'] })
            await qc.invalidateQueries({ queryKey: ['transactions'] })

            showToast("Entrega registrada correctamente", "success")

            // Generate Receipt
            try {
                await generateDeliveryReceipt(deliveredOrder, {
                    amountPaidNow: pending > 0.01 ? pending : 0,
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
                            <span className="text-muted-foreground">Valor Total (Factura):</span>
                            <span className="font-medium">{formatCurrency(total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Pagado:</span>
                            <span className="font-medium text-green-600">{formatCurrency(paid)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-2 border-t">
                            <span>Saldo Pendiente:</span>
                            <span className={pending > 0.01 ? "text-red-600" : "text-slate-600"}>
                                {formatCurrency(pending)}
                            </span>
                        </div>
                    </div>

                    {pending > 0.01 ? (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3">
                            <div className="flex items-start gap-2 text-amber-800">
                                <CreditCard className="h-5 w-5 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm">Cobro Obligatorio</h4>
                                    <p className="text-xs text-amber-700 leading-tight mt-1">
                                        El pedido tiene saldo pendiente. Debe registrar el cobro total ({formatCurrency(pending)}) para completar la entrega.
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
                        disabled={isSubmitting || (pending > 0.01 && paymentMethod !== 'EFECTIVO' && !selectedBankId)}
                        className={pending > 0.01 ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                    >
                        {isSubmitting ? 'Procesando...' : (pending > 0.01 ? 'Cobrar y Entregar' : 'Confirmar Entrega')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
