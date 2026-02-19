import { useFormik } from "formik"
import * as Yup from "yup"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import type { BankAccount, BankAccountType } from "@/entities/bank-account/model/types"
import { useCreateBankAccount, useUpdateBankAccount } from "@/features/bank-account/api/hooks"

interface BankAccountFormProps {
    account?: BankAccount | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const validationSchema = Yup.object({
    name: Yup.string().required("El nombre es requerido"),
    type: Yup.string().oneOf(['CASH', 'BANK']).required("El tipo es requerido"),
    currentBalance: Yup.number().min(0, "Debe ser mayor o igual a 0").required("Requerido"),
    isActive: Yup.boolean().default(true),
})

export function BankAccountForm({ account, open, onOpenChange }: BankAccountFormProps) {
    const createAccount = useCreateBankAccount()
    const updateAccount = useUpdateBankAccount()
    const isEditing = !!account

    const formik = useFormik({
        initialValues: {
            name: account?.name || "",
            type: account?.type || "BANK" as BankAccountType,
            currentBalance: account?.currentBalance || 0,
            isActive: account ? account.isActive : true,
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                if (isEditing && account) {
                    await updateAccount.mutateAsync({ id: account.id, data: values })
                } else {
                    await createAccount.mutateAsync(values)
                }
                onOpenChange(false)
                formik.resetForm()
            } catch (error) {
                console.error("Error saving account", error)
            }
        }
    })

    const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Cuenta" : "Nueva Cuenta"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Cuenta</Label>
                        <Input
                            id="name"
                            {...formik.getFieldProps('name')}
                            placeholder="Ej. Banco Pichincha - Ahorros"
                        />
                        {formik.touched.name && formik.errors.name && (
                            <p className="text-red-500 text-xs">{formik.errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <select
                            id="type"
                            {...formik.getFieldProps('type')}
                            className={inputClass}
                        >
                            <option value="BANK">Banco</option>
                            <option value="CASH">Efectivo</option>
                        </select>
                        {formik.touched.type && formik.errors.type && (
                            <p className="text-red-500 text-xs">{formik.errors.type}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currentBalance">Saldo Actual ($)</Label>
                        <Input
                            id="currentBalance"
                            type="number"
                            step="0.01"
                            {...formik.getFieldProps('currentBalance')}
                        />
                        {formik.touched.currentBalance && formik.errors.currentBalance && (
                            <p className="text-red-500 text-xs">{formik.errors.currentBalance}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            id="isActive"
                            checked={formik.values.isActive}
                            onCheckedChange={(checked) => formik.setFieldValue('isActive', checked)}
                        />
                        <Label htmlFor="isActive">Activa</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {isEditing ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
