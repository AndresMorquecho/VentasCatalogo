import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, ArrowLeft, Loader2, Clock } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useBankAccountList } from "@/features/bank-accounts/api/hooks";
import { walletApi } from "@/features/wallet/api/walletApi";
import { useNotifications } from "@/shared/lib/notifications";

interface Props {
    clientId: string;
    onBack: () => void;
    onRechargeSuccess: (rechargeId: string) => void;
}

type QuickMethod = 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';

export function WalletRechargeQuick({ clientId, onBack, onRechargeSuccess }: Props) {
    const [method, setMethod] = useState<QuickMethod>('TRANSFERENCIA');
    const [amount, setAmount] = useState<string>('');
    const [bankAccountId, setBankAccountId] = useState<string>('');
    const [reference, setReference] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const { data: bankAccountsResponse } = useBankAccountList();
    const bankAccounts = bankAccountsResponse?.data || [];
    const { notifySuccess, notifyError } = useNotifications();
    const queryClient = useQueryClient();

    const filteredAccounts = bankAccounts.filter(acc => acc.type === 'BANK');

    const mutation = useMutation({
        mutationFn: () => walletApi.instantRecharge({
            clientId,
            amount: parseFloat(amount),
            paymentMethod: method,
            bankAccountId,
            reference: reference.trim() || undefined,
            notes: notes.trim() || undefined
        }),
        onSuccess: (data) => {
            notifySuccess('Recarga registrada. Quedará disponible una vez validada en Validaciones de Billetera.');
            queryClient.invalidateQueries({ queryKey: ['wallet-recharges'] });
            setSubmitted(true);
            onRechargeSuccess(data.id);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.error?.message || err?.message || 'Error al registrar recarga';
            setError(msg);
            notifyError(err, 'Error al registrar recarga');
        }
    });

    const handleSubmit = () => {
        setError(null);
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            setError('El monto debe ser mayor a 0');
            return;
        }
        if (!bankAccountId) {
            setError('Selecciona una cuenta bancaria');
            return;
        }
        mutation.mutate();
    };

    // Success state
    if (submitted) {
        return (
            <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-monchito-purple transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver al pago
                    </button>
                </div>

                <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Recarga registrada</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                            La recarga quedará pendiente de validación. Una vez aprobada en
                            <span className="font-medium text-monchito-purple"> Validaciones de Billetera</span>,
                            el saldo estará disponible para el cliente.
                        </p>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onBack}
                        className="h-8 px-6 text-xs bg-monchito-purple hover:bg-monchito-purple/90 mt-1"
                    >
                        Volver al pago
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={mutation.isPending}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-monchito-purple transition-colors disabled:opacity-50"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Volver al pago
                </button>
            </div>

            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                La recarga quedará pendiente de validación. El saldo estará disponible una vez aprobada en Validaciones de Billetera.
            </p>

            {error && (
                <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded px-2 py-1.5">
                    {error}
                </p>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Método</label>
                    <select
                        value={method}
                        onChange={(e) => {
                            setMethod(e.target.value as QuickMethod);
                            setBankAccountId('');
                        }}
                        className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                    >
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="DEPOSITO">Depósito</option>
                        <option value="CHEQUE">Cheque</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Monto</label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-xs font-mono"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Cuenta de destino</label>
                <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                    <option value="">Seleccionar cuenta...</option>
                    {filteredAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                            {acc.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Referencia / Comprobante</label>
                <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="N° de transacción o comprobante"
                    className="h-8 text-xs"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Observación (opcional)</label>
                <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalle adicional..."
                    className="h-8 text-xs"
                />
            </div>

            <div className="flex gap-2 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="h-8 px-4 text-xs flex-1"
                    disabled={mutation.isPending}
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={mutation.isPending || !amount || !bankAccountId}
                    className="h-8 px-4 text-xs flex-1 bg-monchito-purple hover:bg-monchito-purple/90"
                >
                    {mutation.isPending ? (
                        <><Loader2 className="h-3 w-3 animate-spin mr-1" />Procesando...</>
                    ) : (
                        <><Wallet className="h-3 w-3 mr-1" />Registrar recarga</>
                    )}
                </Button>
            </div>
        </div>
    );
}
