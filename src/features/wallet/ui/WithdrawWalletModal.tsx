import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { DecimalTextField } from "@/shared/ui/DecimalTextField";
import { Label } from "@/shared/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import { useBankAccountList } from "@/features/bank-accounts/api/hooks";
import { useNotifications } from "@/shared/lib/notifications";
import { walletApi } from "../api/walletApi";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet, Banknote, CreditCard, Minus } from "lucide-react";

interface WithdrawWalletModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    clientName: string;
    maxAmount: number;
}

export function WithdrawWalletModal({ open, onOpenChange, clientId, clientName, maxAmount }: WithdrawWalletModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: bankAccountsResponse } = useBankAccountList({ limit: 100 });
    const { notifySuccess, notifyError } = useNotifications();
    const queryClient = useQueryClient();

    const bankAccounts = bankAccountsResponse?.data || [];

    const validationSchema = Yup.object({
        amount: Yup.number()
            .positive("El monto debe ser positivo")
            .max(maxAmount, `El monto máximo a devolver es $${maxAmount.toFixed(2)}`)
            .required("Requerido"),
        bankAccountId: Yup.string().required("Cuenta bancaria requerida"),
    });

    const formik = useFormik({
        initialValues: {
            amount: "" as any,
            bankAccountId: "",
            reason: "",
        },
        validationSchema,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            try {
                const payload = {
                    clientId,
                    amount: Number(values.amount),
                    bankAccountId: values.bankAccountId,
                    reason: values.reason,
                };

                await walletApi.withdrawBalance(payload);

                notifySuccess("Devolución de saldo registrada exitosamente.");

                queryClient.invalidateQueries({ queryKey: ["client-credits"] });
                queryClient.invalidateQueries({ queryKey: ["wallet-recharges"] });
                queryClient.invalidateQueries({ queryKey: ["wallet-history", clientId] });
                
                onOpenChange(false);
                formik.resetForm();
            } catch (error: any) {
                console.error("Error al devolver saldo", error);
                notifyError(error, "No se pudo procesar la devolución.");
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[500px] border-none shadow-2xl p-0 flex flex-col overflow-hidden rounded-2xl pointer-events-auto">
                <DialogHeader className="p-4 sm:p-6 bg-rose-50 border-b border-rose-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-tight truncate">Devolver Saldo</DialogTitle>
                            <p className="text-[9px] sm:text-[10px] font-bold text-rose-600 uppercase tracking-wider truncate">Cliente: {clientName}</p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto bg-white p-4 sm:p-6 space-y-5">
                    <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100 mb-4 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-rose-600">Saldo Disponible</span>
                        <span className="text-xl font-black text-rose-700">${maxAmount.toFixed(2)}</span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                <Banknote className="h-3 w-3" /> Monto a Devolver ($)
                            </Label>
                            <DecimalTextField
                                placeholder="0.00"
                                className="h-10 sm:h-11 border-slate-200 font-black text-lg sm:text-xl text-rose-600 bg-rose-50/50 border-rose-100"
                                value={Number(formik.values.amount) || 0}
                                onValueChange={(n) => formik.setFieldValue("amount", n)}
                                onBlur={() => formik.setFieldTouched("amount", true)}
                            />
                            {formik.touched.amount && formik.errors.amount && (
                                <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.amount as string}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                <CreditCard className="h-3 w-3" /> Origen de Fondos (Caja/Banco)
                            </Label>
                            <Select
                                value={formik.values.bankAccountId}
                                onValueChange={(val) => formik.setFieldValue("bankAccountId", val)}
                            >
                                <SelectTrigger className="h-10 sm:h-11 border-slate-200 font-bold text-xs bg-slate-50/50">
                                    <SelectValue placeholder="Seleccione cuenta o caja..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id} label={acc.name}>
                                            <span className="text-xs">{acc.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formik.touched.bankAccountId && formik.errors.bankAccountId && (
                                <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.bankAccountId as string}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                Motivo / Observación
                            </Label>
                            <textarea
                                placeholder="Ej: Devolución solicitada por el cliente..."
                                className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm font-medium transition-all"
                                {...formik.getFieldProps("reason")}
                            />
                        </div>
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="font-bold text-slate-400 hover:text-slate-600 uppercase text-[10px] tracking-widest h-10 px-4"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => formik.handleSubmit()}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest px-6 h-10 shadow-lg shadow-rose-500/20"
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Minus className="mr-2 h-4 w-4" />
                        )}
                        Registrar Devolución
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
