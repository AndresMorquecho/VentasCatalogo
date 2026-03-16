import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import { useClientList } from "@/features/clients/api/hooks";
import { useBankAccountList } from "@/features/bank-accounts/api/hooks";
import { useNotifications } from "@/shared/lib/notifications";
import { walletApi } from "../api/walletApi";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet, User, Banknote, CreditCard, FileText, Plus } from "lucide-react";

interface RechargeWalletModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const validationSchema = Yup.object({
    clientId: Yup.string().required("El cliente es requerido"),
    amount: Yup.number().positive("El monto debe ser positivo").required("Requerido"),
    paymentMethod: Yup.string().required("El método de pago es requerido"),
    bankAccountId: Yup.string().when("paymentMethod", {
        is: (val: string) => val !== "EFECTIVO",
        then: (schema) => schema.required("Cuenta bancaria requerida"),
        otherwise: (schema) => schema.notRequired(),
    }),
    reference: Yup.string().when("paymentMethod", {
        is: (val: string) => val !== "EFECTIVO",
        then: (schema) => schema.required("Referencia requerida"),
        otherwise: (schema) => schema.notRequired(),
    }),
});

export function RechargeWalletModal({ open, onOpenChange }: RechargeWalletModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: clientsResponse } = useClientList({ limit: 1000 });
    const { data: bankAccountsResponse } = useBankAccountList({ limit: 100 });
    const { notifySuccess, notifyError } = useNotifications();
    const queryClient = useQueryClient();

    const clients = clientsResponse?.data || [];
    const bankAccounts = bankAccountsResponse?.data || [];

    const formik = useFormik({
        initialValues: {
            clientId: "",
            amount: "" as any,
            paymentMethod: "EFECTIVO",
            bankAccountId: "",
            reference: "",
            notes: "",
        },
        validationSchema,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            try {
                const payload = {
                    client_id: values.clientId,
                    amount: Number(values.amount),
                    payment_method: values.paymentMethod as any,
                    bank_account_id: values.paymentMethod === "EFECTIVO" ? undefined : values.bankAccountId,
                    reference: values.paymentMethod === "EFECTIVO" ? undefined : values.reference,
                    notes: values.notes,
                };

                await walletApi.recharge(payload);

                notifySuccess("Solicitud de recarga registrada. Un administrador debe validarla.");

                queryClient.invalidateQueries({ queryKey: ["client-credits"] });
                queryClient.invalidateQueries({ queryKey: ["wallet-recharges"] });
                
                onOpenChange(false);
                formik.resetForm();
            } catch (error: any) {
                console.error("Error al recargar wallet", error);
                notifyError(error, "No se pudo procesar la recarga.");
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    // Filtramos cuentas bancarias según el método de pago
    const filteredBankAccounts = bankAccounts.filter(acc => {
        if (formik.values.paymentMethod === "EFECTIVO") return acc.type === "CASH";
        return acc.type === "BANK";
    });

    // Auto-seleccionar cuenta si solo hay una disponible
    useEffect(() => {
        if (filteredBankAccounts.length === 1 && !formik.values.bankAccountId) {
            formik.setFieldValue("bankAccountId", filteredBankAccounts[0].id);
        } else if (filteredBankAccounts.length === 0) {
            formik.setFieldValue("bankAccountId", "");
        }
    }, [filteredBankAccounts, formik.values.paymentMethod]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] border-none shadow-2xl overflow-hidden p-0">
                <DialogHeader className="p-6 bg-slate-50 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Recargar Billetera</DialogTitle>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gestión de saldo a favor del cliente</p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Columna Izquierda: Identificación */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                    <User className="h-3 w-3" /> Información del Cliente
                                </Label>
                                <Select
                                    value={formik.values.clientId}
                                    onValueChange={(val) => {
                                    console.log('[RechargeWalletModal] Selected client ID:', val);
                                    formik.setFieldValue("clientId", val);
                                }}
                                >
                                    <SelectTrigger className="h-11 border-slate-200 font-bold text-sm bg-slate-50/50 hover:bg-white transition-colors focus:ring-primary/20">
                                        <SelectValue placeholder="Seleccione un cliente..." />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {clients.map((c) => (
                                            <SelectItem key={c.id} value={c.id} label={`${c.firstName} (${c.identificationNumber})`}>
                                                <div className="flex flex-col text-left py-1">
                                                    <span className="font-bold text-slate-700 leading-tight">{c.firstName}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono italic">{c.identificationNumber}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formik.touched.clientId && formik.errors.clientId && (
                                    <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{formik.errors.clientId}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                        <CreditCard className="h-3 w-3" /> Método
                                    </Label>
                                    <Select
                                        value={formik.values.paymentMethod}
                                        onValueChange={(val) => formik.setFieldValue("paymentMethod", val)}
                                    >
                                        <SelectTrigger className="h-11 border-slate-200 font-black text-[11px] uppercase bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EFECTIVO" label="EFECTIVO">EFECTIVO</SelectItem>
                                            <SelectItem value="TRANSFERENCIA" label="TRANSFERENCIA">TRANSFERENCIA</SelectItem>
                                            <SelectItem value="DEPOSITO" label="DEPÓSITO">DEPÓSITO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                        <Banknote className="h-3 w-3" /> Monto ($)
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="h-11 border-slate-200 font-black text-xl text-primary bg-primary/5 border-primary/20"
                                        {...formik.getFieldProps("amount")}
                                    />
                                    {formik.touched.amount && formik.errors.amount && (
                                        <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.amount as string}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Detalles de Pago */}
                        <div className="space-y-5">
                            {formik.values.paymentMethod !== "EFECTIVO" && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                            <CreditCard className="h-3 w-3" /> Cuenta de Recepción
                                        </Label>
                                        <Select
                                            value={formik.values.bankAccountId}
                                            onValueChange={(val) => formik.setFieldValue("bankAccountId", val)}
                                        >
                                            <SelectTrigger className="h-11 border-slate-200 font-bold text-xs uppercase bg-white">
                                                <SelectValue placeholder="Seleccione cuenta..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredBankAccounts.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id} label={`${acc.name} - ${acc.bankName}`}>
                                                        {acc.name} - {acc.bankName}
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
                                            <FileText className="h-3 w-3" /> Comprobante / N° de Referencia
                                        </Label>
                                        <Input
                                            placeholder="N° de transacción"
                                            className="h-11 border-slate-200 font-bold text-sm bg-slate-50/30"
                                            {...formik.getFieldProps("reference")}
                                        />
                                        {formik.touched.reference && formik.errors.reference && (
                                            <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.reference as string}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-2 opacity-70">
                            Notas Adicionales
                        </Label>
                        <textarea
                            placeholder="Opcional: detalles sobre el motivo de la recarga..."
                            className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 font-medium transition-all"
                            {...formik.getFieldProps("notes")}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="font-bold text-slate-400 hover:text-slate-600 uppercase text-[10px] tracking-widest h-11 px-6"
                        >
                            Cerrar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest px-10 h-11 shadow-xl shadow-slate-200 rounded-lg group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            )}
                            Registrar Solicitud
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
