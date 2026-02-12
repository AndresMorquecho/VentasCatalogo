import { useState } from "react"
import { useBankAccountList } from "@/entities/bank-account/model/hooks"
import { useRemoveOrderPayment } from "../model"
import { getPaidAmount, getPendingAmount } from "@/entities/order/model/model"
import { Button } from "@/shared/ui/button"
import { Pencil, Trash2, Plus } from "lucide-react"
import type { Order, OrderPayment } from "@/entities/order/model/types"
import { OrderPaymentForm } from "./OrderPaymentForm"
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
}

export function OrderPaymentList({ order }: OrderPaymentListProps) {
    const { data: bankAccounts = [] } = useBankAccountList()
    const removePayment = useRemoveOrderPayment()

    const [selectedPayment, setSelectedPayment] = useState<OrderPayment | undefined>(undefined)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const payments = order.payments || []
    const paidAmount = getPaidAmount(order)
    const pendingAmount = getPendingAmount(order)

    const handleCreate = () => {
        setSelectedPayment(undefined)
        setIsFormOpen(true)
    }

    const handleEdit = (payment: OrderPayment) => {
        setSelectedPayment(payment)
        setIsFormOpen(true)
    }

    const handleDelete = async (paymentId: string) => {
        if (!confirm("¿Está seguro de eliminar este pago?")) return

        const payment = payments.find(p => p.id === paymentId)
        if (!payment) return

        const bankAccount = bankAccounts.find(b => b.id === payment.bankAccountId)
        if (!bankAccount) {
            alert("No se encontró la cuenta bancaria asociada. No se puede revertir el saldo.")
            return
        }

        try {
            await removePayment.mutateAsync({
                order,
                paymentId,
                bankAccount // Pass found bank account
            })
        } catch (error) {
            console.error("Error removing payment", error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border">
                <div>
                    <h4 className="font-medium text-sm mb-1">Resumen Financiero</h4>
                    <div className="flex gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Pagado</p>
                            <p className="text-lg font-bold text-green-600">{format(paidAmount)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Pendiente</p>
                            <p className="text-lg font-bold text-red-600">{format(pendingAmount)}</p>
                        </div>
                    </div>
                </div>
                <div>
                    {pendingAmount > 0.01 && (
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
                            <TableHead className="text-right w-[80px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.deposit > 0 && (
                            <TableRow className="bg-muted/10">
                                <TableCell className="text-muted-foreground">Inicio</TableCell>
                                <TableCell>Abono Inicial</TableCell>
                                <TableCell className="text-right font-medium">{format(order.deposit)}</TableCell>
                                <TableCell className="text-right">
                                    <span className="text-xs text-muted-foreground italic">--</span>
                                </TableCell>
                            </TableRow>
                        )}

                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                    No hay abonos adicionales.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => {
                                const account = bankAccounts.find(b => b.id === payment.bankAccountId)
                                return (
                                    <TableRow key={payment.id}>
                                        <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{account?.name || "Desconocida"}</TableCell>
                                        <TableCell className="text-right font-medium">{format(payment.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(payment)}>
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(payment.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <OrderPaymentForm
                order={order}
                payment={selectedPayment}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />
        </div>
    )
}
