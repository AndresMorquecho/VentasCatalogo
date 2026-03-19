import { useState } from "react"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { useRemoveOrderPayment } from "../model"
import { getPaidAmount, getPendingAmount } from "@/entities/order/model/model"
import { Button } from "@/shared/ui/button"
import { Pencil, Trash2, Plus } from "lucide-react"
import type { Order, OrderPayment } from "@/entities/order/model/types"
import { OrderPaymentForm } from "./OrderPaymentForm"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"

// Helper
function format(amount: number): string {
    return `$${amount.toFixed(2)}`
}

interface OrderPaymentListProps {
    order: Order
    readOnly?: boolean
}

export function OrderPaymentList({ order, readOnly = false }: OrderPaymentListProps) {
    const { data: bankAccountsResponse } = useBankAccountList()
    const bankAccounts = bankAccountsResponse?.data || []
    const removePayment = useRemoveOrderPayment()

    const [selectedPayment, setSelectedPayment] = useState<OrderPayment | undefined>(undefined)
    const [isFormOpen, setIsFormOpen] = useState(false)

    // ConfirmDialog state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)
    const [noBankAccountAlertOpen, setNoBankAccountAlertOpen] = useState(false)

    const payments = order.payments || []
    const paidAmount = getPaidAmount(order)
    const pendingAmount = getPendingAmount(order)

    // Si hay sobrepago, 'pendingAmount' será negativo. Lo normalizamos para mostrar el saldo a favor.
    const isOverpaid = pendingAmount < 0;
    const overpaidAmount = isOverpaid ? Math.abs(pendingAmount) : 0;
    const normalizedPendingAmount = Math.max(0, pendingAmount);

    const handleCreate = () => {
        setSelectedPayment(undefined)
        setIsFormOpen(true)
    }

    const handleEdit = (payment: OrderPayment) => {
        setSelectedPayment(payment)
        setIsFormOpen(true)
    }

    const handleDeleteRequest = (paymentId: string) => {
        const payment = payments.find(p => p.id === paymentId)
        if (!payment) return

        const bankAccount = bankAccounts.find(b => b.id === payment.bankAccountId)
        if (!bankAccount) {
            setNoBankAccountAlertOpen(true)
            return
        }

        setPaymentToDelete(paymentId)
        setDeleteConfirmOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!paymentToDelete) return

        const payment = payments.find(p => p.id === paymentToDelete)
        if (!payment) return

        const bankAccount = bankAccounts.find(b => b.id === payment.bankAccountId)
        if (!bankAccount) return

        try {
            await removePayment.mutateAsync({
                order,
                paymentId: paymentToDelete,
                bankAccount
            })
        } catch (error) {
            console.error("Error removing payment", error)
        } finally {
            setPaymentToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border">
                <div>
                    <h4 className="font-medium text-sm mb-1">Resumen de Abonos</h4>
                    <div className="flex gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Pagado</p>
                            <p className="text-lg font-bold text-green-600">{format(paidAmount)}</p>
                        </div>

                        {isOverpaid ? (
                            <div>
                                <p className="text-xs font-semibold text-emerald-600">Saldo a Favor</p>
                                <p className="text-lg font-bold text-emerald-600">{format(overpaidAmount)}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs text-muted-foreground">Pendiente</p>
                                <p className="text-lg font-bold text-red-600">{format(normalizedPendingAmount)}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    {!readOnly && pendingAmount > 0.01 && (
                        <Button variant="outline" size="sm" onClick={handleCreate}>
                            <Plus className="mr-2 h-3 w-3" /> Agregar Abono
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border text-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cuenta</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            {!readOnly && <TableHead className="text-right w-[80px]">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={readOnly ? 3 : 4} className="text-center text-muted-foreground py-4">
                                    No hay abonos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => {
                                const account = bankAccounts.find(b => b.id === payment.bankAccountId)
                                return (
                                    <TableRow key={payment.id}>
                                        <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{account?.name || account?.bankName || payment.method || "Desconocida"}</TableCell>
                                        <TableCell className="text-right font-medium">{format(payment.amount)}</TableCell>
                                        {!readOnly && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(payment)}>
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRequest(payment.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {!readOnly && (
                <OrderPaymentForm
                    order={order}
                    payment={selectedPayment}
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                />
            )}

            {/* Confirm: Delete Payment */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Pago"
                description="¿Está seguro de eliminar este pago? Esta acción revertirá el saldo del pedido y descontará el monto de la cuenta bancaria correspondiente."
                confirmText="Sí, Eliminar"
                variant="destructive"
            />

            {/* Info: No bank account found */}
            <ConfirmDialog
                open={noBankAccountAlertOpen}
                onOpenChange={setNoBankAccountAlertOpen}
                onConfirm={() => setNoBankAccountAlertOpen(false)}
                title="Cuenta Bancaria No Encontrada"
                description="No se encontró la cuenta bancaria asociada a este pago. No se puede revertir el saldo correctamente."
                confirmText="Entendido"
                cancelText=""
            />
        </div>
    )
}
