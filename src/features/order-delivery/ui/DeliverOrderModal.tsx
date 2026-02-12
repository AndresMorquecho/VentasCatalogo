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
import { Truck, CreditCard } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { deliverOrder, getPendingAmount, getEffectiveTotal } from "@/entities/order/model/model"
import { useAddOrderPayment } from "@/features/order-payments/model"
import { useBankAccountList } from "@/entities/bank-account/model/hooks"

interface DeliverOrderModalProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeliverOrderModal({ order, open, onOpenChange }: DeliverOrderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedBankId, setSelectedBankId] = useState<string>('')

    const qc = useQueryClient()
    const { mutateAsync: addPayment } = useAddOrderPayment()
    const { data: bankAccounts = [] } = useBankAccountList()

    if (!order) return null

    const pending = getPendingAmount(order)
    const total = getEffectiveTotal(order)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // 1. Process Payment if pending amount exists
            if (pending > 0.01) {
                if (!selectedBankId) {
                    alert("Por favor seleccione una cuenta para registrar el cobro.")
                    setIsSubmitting(false)
                    return
                }
                const bankAccount = bankAccounts.find(b => b.id === selectedBankId)
                if (!bankAccount) return

                // Reuse existing payment logic (Atomic inside addPayment mutation)
                // However, we need to pass the updated order to deliverOrder
                // But addPayment mutation returns the updated order
                const paidOrder = await addPayment({
                    order,
                    amount: pending,
                    bankAccount
                })

                // 2. Mark as Delivered using the updated order (paid)
                const deliveredOrder = deliverOrder(paidOrder)
                await orderApi.update(deliveredOrder.id, deliveredOrder)
            } else {
                // Direct delivery if no pending balance
                const deliveredOrder = deliverOrder(order)
                await orderApi.update(deliveredOrder.id, deliveredOrder)
            }

            await qc.invalidateQueries({ queryKey: ['orders'] })
            await qc.invalidateQueries({ queryKey: ['financial-movements'] })
            onOpenChange(false)
        } catch (error) {
            console.error("Error processing delivery:", error)
            alert("Ocurrió un error al procesar la entrega.")
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
                            <span className="font-medium text-green-600">{formatCurrency(order.paidAmount)}</span>
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

                            <div className="space-y-1.5 pt-2">
                                <Label className="text-xs font-medium text-amber-800">Cuenta de Destino</Label>
                                <select
                                    value={selectedBankId}
                                    onChange={(e) => setSelectedBankId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="" disabled>Seleccione cuenta...</option>
                                    {bankAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.bankName} - {account.holderName} ({formatCurrency(account.currentBalance)})
                                        </option>
                                    ))}
                                </select>
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
                        disabled={isSubmitting || (pending > 0.01 && !selectedBankId)}
                        className={pending > 0.01 ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                    >
                        {isSubmitting ? 'Procesando...' : (pending > 0.01 ? 'Cobrar y Entregar' : 'Confirmar Entrega')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
