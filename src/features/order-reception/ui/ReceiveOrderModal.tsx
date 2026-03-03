import { useState, useEffect } from "react"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/shared/ui/dialog"
import { AsyncButton } from "@/shared/ui/async-button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select"
import { PackageCheck, DollarSign } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { bankAccountApi } from "@/shared/api/bankAccountApi"
import { Separator } from "@/shared/ui/separator"
import { useNotifications } from "@/shared/lib/notifications"
import { useAuth } from "@/shared/auth"
import { logAction } from "@/shared/lib/auditService"

interface ReceiveOrderModalProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReceiveOrderModal({ order, open, onOpenChange }: ReceiveOrderModalProps) {
    const [invoiceTotal, setInvoiceTotal] = useState<string>('')
    const [invoiceNumber, setInvoiceNumber] = useState<string>('')
    const [abonoRecepcion, setAbonoRecepcion] = useState<string>('')
    const [bankAccountId, setBankAccountId] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<string>('EFECTIVO')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { notifySuccess, notifyError } = useNotifications()
    const { user } = useAuth()
    const qc = useQueryClient()

    // Fetch bank accounts
    const { data: bankAccounts = [] } = useQuery({
        queryKey: ['bankAccounts'],
        queryFn: bankAccountApi.getAll,
        staleTime: 5 * 60 * 1000
    })

    // Reset form when order changes
    useEffect(() => {
        if (order) {
            setInvoiceTotal(order.total.toString())
            setInvoiceNumber('')
            setAbonoRecepcion('')
            setBankAccountId('')
            setPaymentMethod('EFECTIVO')
        }
    }, [order])

    if (!order) return null

    const handleSubmit = async () => {
        if (!invoiceTotal) return
        const total = parseFloat(invoiceTotal)
        if (isNaN(total) || total <= 0) return

        let finalBankAccountId = bankAccountId

        // Validate abono if provided
        const abono = abonoRecepcion ? parseFloat(abonoRecepcion) : 0
        if (abono > 0) {
            if (!paymentMethod) {
                notifyError({ message: 'Debe seleccionar un método de pago' })
                return
            }
            if (paymentMethod === 'EFECTIVO' && !finalBankAccountId) {
                const cashAccount = bankAccounts.find(a => a.type === 'CASH')
                if (cashAccount) finalBankAccountId = cashAccount.id
            }
            if (!finalBankAccountId) {
                notifyError({ message: 'Debe seleccionar una cuenta bancaria para el abono' })
                return
            }
        }

        setIsSubmitting(true)
        try {
            // Use the dedicated reception endpoint instead of generic update
            await orderApi.receiveOrder(order.id, {
                finalTotal: total,
                invoiceNumber: invoiceNumber || undefined,
                abonoRecepcion: abono > 0 ? abono : undefined,
                bankAccountId: abono > 0 ? finalBankAccountId : undefined,
                paymentMethod: abono > 0 ? paymentMethod : undefined
            })

            await qc.invalidateQueries({ queryKey: ['orders'] })
            notifySuccess(`Pedido #${order.receiptNumber} recibido correctamente.`)

            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'UPDATE_ORDER',
                    module: 'orders',
                    detail: `Recibió pedido ${order.receiptNumber} de la empresaria ${order.clientName}. Nuevo total: $${total.toFixed(2)}`
                });
            }

            onOpenChange(false)
        } catch (error) {
            console.error(error)
            notifyError(error, 'Error al recibir el pedido')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (val: number) => `$${val.toFixed(2)}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-900">
                        <PackageCheck className="h-5 w-5" />
                        Recepción en Bodega
                    </DialogTitle>
                    <DialogDescription>
                        Pedido #{order.receiptNumber} - {order.clientName}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoice-total">Valor Real de Factura ($)</Label>
                        <Input
                            id="invoice-total"
                            type="number"
                            value={invoiceTotal}
                            onChange={(e) => setInvoiceTotal(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            className="font-bold text-lg"
                        />
                        <p className="text-xs text-muted-foreground">
                            Valor estimado original: {formatCurrency(order.total)}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="invoice-number">Número de Factura (Opcional)</Label>
                        <Input
                            id="invoice-number"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            placeholder="Ej: 001-002-123456"
                        />
                    </div>

                    <Separator className="my-2" />

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <Label className="text-sm font-semibold text-blue-900">Abono Adicional (Opcional)</Label>
                        </div>

                        <div className="grid gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="abono-recepcion" className="text-xs">Monto del Abono ($)</Label>
                                <Input
                                    id="abono-recepcion"
                                    type="number"
                                    value={abonoRecepcion}
                                    onChange={(e) => setAbonoRecepcion(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            {abonoRecepcion && parseFloat(abonoRecepcion) > 0 && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="payment-method" className="text-xs">Método de Pago</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger id="payment-method">
                                                <SelectValue placeholder="Seleccionar método" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                                <SelectItem value="DEPOSITO">Depósito</SelectItem>
                                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {true && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="bank-account" className="text-xs">Cuenta Bancaria</Label>
                                            <Select value={bankAccountId} onValueChange={setBankAccountId}>
                                                <SelectTrigger id="bank-account">
                                                    <SelectValue placeholder="Seleccionar cuenta" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {bankAccounts
                                                        .filter(acc => {
                                                            if (!acc.isActive) return false;
                                                            if (paymentMethod === 'TRANSFERENCIA' || paymentMethod === 'DEPOSITO') return acc.type === 'BANK';
                                                            if (paymentMethod === 'CHEQUE') return true;
                                                            if (paymentMethod === 'EFECTIVO') return acc.type === 'CASH';
                                                            return true;
                                                        })
                                                        .map(account => (
                                                            <SelectItem key={account.id} value={account.id}>
                                                                {account.name} ({account.type === 'CASH' ? 'Efectivo' : 'Banco'})
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between items-center">
                    <div className="text-xs text-muted-foreground hidden sm:block">
                        Esta acción actualizará el saldo pendiente.
                    </div>
                    <div className="flex gap-2 justify-end w-full sm:w-auto">
                        <AsyncButton variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </AsyncButton>
                        <AsyncButton
                            onClick={handleSubmit}
                            disabled={!invoiceTotal}
                            isLoading={isSubmitting}
                            loadingText="Guardando..."
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            Confirmar Recepción
                        </AsyncButton>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
