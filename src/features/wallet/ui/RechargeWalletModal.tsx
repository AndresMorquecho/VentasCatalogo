import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DecimalTextField } from "@/shared/ui/DecimalTextField";
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
import { Loader2, Wallet, User, Banknote, CreditCard, FileText, Plus, CheckCircle } from "lucide-react";

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
    controlValidation: Yup.string().when("paymentMethod", {
        is: (val: string) => val === "TRANSFERENCIA" || val === "DEPOSITO",
        then: (schema) => schema.required("Control/Validación requerido"),
        otherwise: (schema) => schema.notRequired(),
    }),
    transactionDate: Yup.date().required("La fecha de transacción es requerida"),
});

export function RechargeWalletModal({ open, onOpenChange }: RechargeWalletModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: clientsResponse } = useClientList({ limit: 5000 });
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
            controlValidation: "",
            notes: "",
            transactionDate: format(new Date(), 'yyyy-MM-dd'),
        },
        validationSchema,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            try {
                const payload = {
                    client_id: values.clientId,
                    amount: Number(values.amount),
                    payment_method: values.paymentMethod as any,
                    bank_account_id: values.bankAccountId || undefined,
                    reference: values.reference || undefined,
                    control_validation: values.controlValidation || undefined,
                    notes: values.notes,
                    transaction_date: values.transactionDate,
                };

                await walletApi.recharge(payload);

                const successMsg = values.paymentMethod === "EFECTIVO" 
                    ? "Recarga de efectivo registrada y aprobada instantáneamente."
                    : "Solicitud de recarga registrada. Un administrador debe validarla.";

                notifySuccess(successMsg);

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
        if (formik.values.paymentMethod === "CHEQUE") return true; // CHEQUE acepta cualquier cuenta
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
            <DialogContent className="w-[95vw] sm:max-w-[800px] h-auto max-h-[95vh] sm:max-h-[85vh] border-none shadow-2xl p-0 flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl pointer-events-auto">
                <DialogHeader className="p-4 sm:p-6 bg-slate-50 border-b shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-tight truncate">Recargar Billetera</DialogTitle>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Gestión de saldo a favor del cliente</p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
                            {/* Columna Izquierda: Identificación */}
                            <div className="space-y-4 sm:space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                        <User className="h-3 w-3" /> Información del Cliente
                                    </Label>
                                    <Select
                                        value={formik.values.clientId}
                                        onValueChange={(val) => {
                                        formik.setFieldValue("clientId", val);
                                    }}
                                    >
                                        <SelectTrigger className="h-10 sm:h-11 border-slate-200 font-bold text-xs sm:text-sm bg-slate-50/50 hover:bg-white transition-colors focus:ring-primary/20">
                                            <SelectValue placeholder="Seleccione un cliente..." />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id} label={`${c.firstName} (${c.identificationNumber})`}>
                                                    <div className="flex flex-col text-left py-1">
                                                        <span className="font-bold text-slate-700 leading-tight text-xs sm:text-sm">{c.firstName}</span>
                                                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono italic">{c.identificationNumber}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formik.touched.clientId && formik.errors.clientId && (
                                        <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{formik.errors.clientId}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                            <CreditCard className="h-3 w-3" /> Método
                                        </Label>
                                        <Select
                                            value={formik.values.paymentMethod}
                                            onValueChange={(val) => formik.setFieldValue("paymentMethod", val)}
                                        >
                                            <SelectTrigger className="h-10 sm:h-11 border-slate-200 font-black text-[10px] sm:text-[11px] uppercase bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EFECTIVO" label="EFECTIVO">EFECTIVO</SelectItem>
                                                <SelectItem value="TRANSFERENCIA" label="TRANSFERENCIA">TRANSFERENCIA</SelectItem>
                                                <SelectItem value="DEPOSITO" label="DEPÓSITO">DEPÓSITO</SelectItem>
                                                <SelectItem value="CHEQUE" label="CHEQUE">CHEQUE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                            Fecha Transacción
                                        </Label>
                                        <Input
                                            type="date"
                                            className="h-10 sm:h-11 border-slate-200 font-bold text-xs sm:text-sm bg-white"
                                            {...formik.getFieldProps("transactionDate")}
                                        />
                                        {formik.touched.transactionDate && formik.errors.transactionDate && (
                                            <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.transactionDate as string}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                            <Banknote className="h-3 w-3" /> Monto ($)
                                        </Label>
                                        <DecimalTextField
                                            placeholder="0.00"
                                            className="h-10 sm:h-11 border-slate-200 font-black text-lg sm:text-xl text-primary bg-primary/5 border-primary/20"
                                            value={Number(formik.values.amount) || 0}
                                            onValueChange={(n) => formik.setFieldValue("amount", n)}
                                            onBlur={() => formik.setFieldTouched("amount", true)}
                                        />
                                        {formik.touched.amount && formik.errors.amount && (
                                            <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.amount as string}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha: Detalles de Pago */}
                            <div className="space-y-4 sm:space-y-5">
                                {formik.values.paymentMethod !== "EFECTIVO" ? (
                                    <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                                <CreditCard className="h-3 w-3" /> Cuenta de Recepción
                                            </Label>
                                            <Select
                                                value={formik.values.bankAccountId}
                                                onValueChange={(val) => formik.setFieldValue("bankAccountId", val)}
                                            >
                                                <SelectTrigger className="h-10 sm:h-11 border-slate-200 font-bold text-[10px] sm:text-xs uppercase bg-white">
                                                    <SelectValue placeholder="Seleccione cuenta..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredBankAccounts.map((acc) => {
                                                        return (
                                                            <SelectItem key={acc.id} value={acc.id} label={acc.name}>
                                                                <span className="text-[10px] sm:text-xs">{acc.name}</span>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            {formik.touched.bankAccountId && formik.errors.bankAccountId && (
                                                <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.bankAccountId as string}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                                <FileText className="h-3 w-3" /> N° TRANSACCIÓN / DOC 
                                            </Label>
                                            <Input
                                                placeholder="N° de transacción o documento"
                                                className="h-10 sm:h-11 border-slate-200 font-bold text-xs sm:text-sm bg-slate-50/30"
                                                {...formik.getFieldProps("reference")}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/^0+/, '');
                                                    formik.setFieldValue("reference", value);
                                                }}
                                            />
                                            {formik.touched.reference && formik.errors.reference && (
                                                <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.reference as string}</p>
                                            )}
                                        </div>
    
                                        {(formik.values.paymentMethod === "TRANSFERENCIA" || formik.values.paymentMethod === "DEPOSITO") && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                                <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 mb-1.5 opacity-70">
                                                    <CheckCircle className="h-3 w-3" /> CONTROL / VALIDACIÓN
                                                </Label>
                                                <Input
                                                    placeholder="Código de validación o control"
                                                    className="h-10 sm:h-11 border-slate-200 font-bold text-xs sm:text-sm bg-slate-50/30"
                                                    {...formik.getFieldProps("controlValidation")}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/^0+/, '');
                                                        formik.setFieldValue("controlValidation", value);
                                                    }}
                                                />
                                                {formik.touched.controlValidation && formik.errors.controlValidation && (
                                                    <p className="text-[10px] font-bold text-red-500 uppercase">{formik.errors.controlValidation as string}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[120px]">
                                        <Wallet className="h-8 w-8 text-slate-300" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Pago en efectivo se aplica instantáneamente</p>
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
                                className="flex min-h-[80px] sm:min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-3 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 font-medium transition-all"
                                {...formik.getFieldProps("notes")}
                            />
                        </div>
                    </div>
                </form>

                <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 bg-white border-t border-slate-100 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="font-bold text-slate-400 hover:text-slate-600 uppercase text-[9px] sm:text-[10px] tracking-widest h-10 sm:h-11 px-4 sm:px-6"
                    >
                        Cerrar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => formik.handleSubmit()}
                        className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[9px] sm:text-[10px] tracking-widest px-6 sm:px-10 h-10 sm:h-11 shadow-xl shadow-primary/20 rounded-lg group"
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                        )}
                        Registrar Solicitud
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
