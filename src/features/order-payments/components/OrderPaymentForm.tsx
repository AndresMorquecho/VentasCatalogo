import { useFormik } from "formik"
import * as Yup from "yup"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { getPendingAmount } from "@/entities/order/model/model"
import { useAddOrderPayment, useEditOrderPayment } from "../model.ts"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
// Actually bank-account/model/model.ts doesn't exist? Check later. 
// I will filter active accounts inline.
import type { Order, OrderPayment } from "@/entities/order/model/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"

// Helper function to format currency
function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

interface OrderPaymentFormProps {
    order: Order
    payment?: OrderPayment
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function OrderPaymentForm({ order, payment, open, onOpenChange }: OrderPaymentFormProps) {
    const { data: bankAccounts = [] } = useBankAccountList()
    const addPayment = useAddOrderPayment()
    const editPayment = useEditOrderPayment()

    // Filter active accounts
    const activeBankAccounts = bankAccounts.filter(acc => acc.isActive)

    const isEditing = !!payment
    const pendingAmount = getPendingAmount(order)

    // Max amount allowable: if editing, max is pending + old amount. If creating, max is pending.
    const maxAmount = isEditing ? pendingAmount + (payment?.amount || 0) : pendingAmount

    const formik = useFormik({
        initialValues: {
            amount: payment?.amount || 0,
            bankAccountId: payment?.bankAccountId || (activeBankAccounts[0]?.id || "")
        },
        validationSchema: Yup.object({
            amount: Yup.number()
                .positive("Debe ser mayor a 0")
                .max(maxAmount + 0.01, `El monto supera el saldo pendiente (${formatCurrency(maxAmount)})`) // +0.01 float margin
                .required("Requerido"),
            bankAccountId: Yup.string().required("Cuenta bancaria requerida")
        }),
        enableReinitialize: true,
        onSubmit: async (values) => {
            const selectedAccount = bankAccounts.find(b => b.id === values.bankAccountId)
            if (!selectedAccount) return

            try {
                if (isEditing && payment) {
                    await editPayment.mutateAsync({
                        order,
                        paymentId: payment.id,
                        newAmount: values.amount,
                        bankAccount: selectedAccount
                    })
                } else {
                    await addPayment.mutateAsync({
                        order,
                        amount: values.amount,
                        bankAccount: selectedAccount
                    })
                }
                onOpenChange(false)
                formik.resetForm()
            } catch (error) {
                console.error("Error saving payment", error)
            }
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Abono" : "Nuevo Abono"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Cuenta Bancaria / Caja</Label>
                        <select
                            id="bankAccountId"
                            {...formik.getFieldProps('bankAccountId')}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isEditing} // Block account change on edit for simplicity/safety
                        >
                            {activeBankAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} ({acc.type === 'CASH' ? 'Efectivo' : 'Banco'})
                                </option>
                            ))}
                        </select>
                        {formik.touched.bankAccountId && formik.errors.bankAccountId && (
                            <p className="text-red-500 text-xs">{formik.errors.bankAccountId}</p>
                        )}
                        {isEditing && <p className="text-xs text-muted-foreground">La cuenta no se puede cambiar al editar.</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto ($)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...formik.getFieldProps('amount')}
                        />
                        {formik.touched.amount && formik.errors.amount && (
                            <p className="text-red-500 text-xs">{formik.errors.amount}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Máximo permitido: {formatCurrency(maxAmount)}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
                            {isEditing ? "Guardar" : "Registrar Pago"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
