import { useFormik } from "formik"
import * as Yup from "yup"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { calculateMaxEditPaymentAmount, calculatePendingBalance, formatCurrency } from "@/entities/order/model/financialCalculator"
import { useAddOrderPayment, useEditOrderPayment } from "../model.ts"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import type { Order, OrderPayment } from "@/entities/order/model/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { useClientCredits } from "@/features/transactions/model/hooks"

interface OrderPaymentFormProps {
    order: Order
    payment?: OrderPayment
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function OrderPaymentForm({ order, payment, open, onOpenChange }: OrderPaymentFormProps) {
    const { data: bankAccounts = [] } = useBankAccountList()
    const { data: credits = [] } = useClientCredits(order.clientId)
    const addPayment = useAddOrderPayment()
    const editPayment = useEditOrderPayment()

    const totalCredit = credits.reduce((sum, c) => sum + Number(c.remainingAmount || 0), 0)

    // Filter active accounts
    const activeBankAccounts = bankAccounts.filter(acc => acc.isActive)

    const isEditing = !!payment

    // Use centralized financial calculator
    const pendingAmount = calculatePendingBalance(order)
    const maxAmount = isEditing
        ? calculateMaxEditPaymentAmount(order, payment?.amount || 0)
        : pendingAmount

    const formik = useFormik({
        initialValues: {
            amount: payment?.amount || 0,
            creditToUse: 0,
            method: (payment?.method === 'CREDITO_CLIENTE' ? 'EFECTIVO' : payment?.method as any) || "EFECTIVO",
            bankAccountId: payment?.bankAccountId || (activeBankAccounts[0]?.id || "")
        },
        validationSchema: Yup.object({
            amount: Yup.number()
                .min(0, "Mínimo 0")
                .max(maxAmount + 0.01, `El monto supera el saldo pendiente (${formatCurrency(maxAmount)})`),
            creditToUse: Yup.number()
                .min(0, "Mínimo 0")
                .max(totalCredit, "Saldo insuficiente"),
            method: Yup.string().when('amount', {
                is: (val: number) => val > 0,
                then: (schema) => schema.required("Requerido"),
                otherwise: (schema) => schema.optional()
            }),
            bankAccountId: Yup.string().test(
                'is-bank-required',
                "Cuenta requerida para este método de pago",
                function (value) {
                    const { amount, method } = this.parent;
                    if (amount > 0 && method !== 'EFECTIVO' && !value) {
                        return false;
                    }
                    return true;
                }
            )
        }),
        enableReinitialize: true,
        onSubmit: async (values) => {
            let selectedAccount = values.amount > 0
                ? bankAccounts.find(b => b.id === values.bankAccountId)
                : undefined;

            if (values.amount > 0 && values.method === 'EFECTIVO') {
                selectedAccount = bankAccounts.find(b => b.type === 'CASH');
            }

            if (values.amount === 0 && values.creditToUse === 0) {
                formik.setFieldError('amount', 'Debe registrar al menos un monto');
                return;
            }

            // Boundary check for sum
            const totalBeingPaid = Number(values.amount) + Number(values.creditToUse);
            if (totalBeingPaid > maxAmount + 0.01) {
                formik.setFieldError('amount', 'La suma total excede el saldo pendiente');
                return;
            }

            try {
                if (isEditing && payment) {
                    await editPayment.mutateAsync({
                        order,
                        paymentId: payment.id,
                        newAmount: values.amount,
                        bankAccount: selectedAccount,
                        method: values.method
                    })
                } else {
                    await addPayment.mutateAsync({
                        order,
                        amount: values.amount,
                        bankAccount: selectedAccount,
                        method: values.method,
                        creditAmount: values.creditToUse
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
                    {!isEditing && totalCredit > 0 && (
                        <div className="space-y-2 p-3 bg-emerald-50 border border-emerald-100 rounded-md">
                            <Label className="text-emerald-800 text-xs font-bold">Usar Saldo a Favor (Disponible: ${totalCredit.toFixed(2)})</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-2 top-1.5 text-xs text-emerald-600">$</span>
                                    <Input
                                        type="number"
                                        className="pl-5 h-8 bg-white border-emerald-200"
                                        placeholder="Monto a usar"
                                        {...formik.getFieldProps('creditToUse')}
                                        onChange={(e) => {
                                            const val = Math.min(Number(e.target.value), totalCredit, maxAmount - Number(formik.values.amount));
                                            formik.setFieldValue('creditToUse', val > 0 ? val : 0);
                                        }}
                                    />
                                </div>
                                {Number(formik.values.creditToUse) > 0 ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-red-500 hover:bg-red-50"
                                        onClick={() => formik.setFieldValue('creditToUse', 0)}
                                    >
                                        Quitar
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                        onClick={() => {
                                            const maxPossible = Math.min(totalCredit, maxAmount - Number(formik.values.amount));
                                            formik.setFieldValue('creditToUse', maxPossible);
                                        }}
                                    >
                                        Usar Máximo
                                    </Button>
                                )}
                            </div>
                            <p className="text-[10px] text-emerald-600">Este monto se descontará del saldo a favor del cliente.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto en Efectivo/Banco ($)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...formik.getFieldProps('amount')}
                        />
                        {formik.touched.amount && formik.errors.amount && (
                            <p className="text-red-500 text-xs">{formik.errors.amount}</p>
                        )}
                    </div>

                    {Number(formik.values.amount) > 0 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="method">Método de Pago</Label>
                                <select
                                    id="method"
                                    {...formik.getFieldProps('method')}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="DEPOSITO">Depósito</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>

                            {formik.values.method !== 'EFECTIVO' && (
                                <div className="space-y-2">
                                    <Label>Cuenta Bancaria / Caja</Label>
                                    <select
                                        id="bankAccountId"
                                        {...formik.getFieldProps('bankAccountId')}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        disabled={isEditing}
                                    >
                                        <option value="">Seleccionar cuenta...</option>
                                        {activeBankAccounts.filter(a => a.type !== 'CASH').map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type === 'CASH' ? 'Efectivo' : 'Banco'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}


                    <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm font-bold">
                            <span>Total a abonar:</span>
                            <span className="text-emerald-600">${(Number(formik.values.amount) + Number(formik.values.creditToUse)).toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">Saldo pendiente tras abono: ${(maxAmount - (Number(formik.values.amount) + Number(formik.values.creditToUse))).toFixed(2)}</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
                            {isEditing ? "Guardar" : "Registrar Abono"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
