import { useState, useMemo, useEffect } from "react";
import { AsyncButton } from "@/shared/ui/async-button";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { useBankAccountList } from "@/features/bank-accounts/api/hooks";
import { usePaymentOperations } from "../model/hooks";
import type { PaymentPayload } from "@/shared/api/paymentApi";
import { calculateCreditFromPayment, formatCurrency, calculatePendingBalance } from "@/entities/order/model/financialCalculator";
import type { Order } from "@/entities/order/model/types";
import { useToast } from "@/shared/ui/use-toast";
import { useClientCredits } from "@/features/transactions/model/hooks";

interface Props {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PaymentFormModal({ order, isOpen, onClose, onSuccess }: Props) {
    const { registerPayment } = usePaymentOperations();
    const { data: bankAccounts = [] } = useBankAccountList();
    const { data: credits = [] } = useClientCredits(order?.clientId || "");
    const [amount, setAmount] = useState<number>(0);
    const [creditToUse, setCreditToUse] = useState<number>(0);
    const [method, setMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'DEPOSITO'>('EFECTIVO');
    const [bankAccountId, setBankAccountId] = useState<string>('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // Use centralized financial calculator
    const pendingBalance = useMemo(() => {
        if (!order) return 0;
        return calculatePendingBalance(order);
    }, [order]);

    // Calculate credit if payment exceeds pending
    const creditGenerated = useMemo(() =>
        calculateCreditFromPayment(order, amount), // Note: using creditToUse to overpay is not allowed, so credit only comes from cash amount
        [order, amount]
    );

    // Auto-select bank account based on method
    useEffect(() => {
        if (method === 'EFECTIVO') {
            const cashAccount = bankAccounts.find(a => a.type === 'CASH');
            setBankAccountId(cashAccount?.id || '');
        } else {
            const bankAccount = bankAccounts.find(a => a.type === 'BANK');
            setBankAccountId(bankAccount?.id || '');
        }
    }, [method, bankAccounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (amount <= 0 && creditToUse <= 0) {
            showToast("Debes ingresar un monto manual o usar saldo a favor.", "error");
            return;
        }

        if (amount > 0 && !bankAccountId) {
            showToast("Debes seleccionar una cuenta para el abono manual.", "error");
            return;
        }

        if (amount + creditToUse > pendingBalance && creditToUse > 0) {
            // Cannot use credit to overpay
            if (amount < pendingBalance) {
                // Adjust creditToUse
                setCreditToUse(pendingBalance - amount);
            } else {
                setCreditToUse(0);
            }
            showToast("No puedes usar saldo a favor si el monto supera el pendiente.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: PaymentPayload = {
                orderId: order.id,
                amount: amount,
                method: method,
                referenceNumber: reference,
                notes: notes,
                bankAccountId: bankAccountId || 'default', // Fallback, won't be used if amount is 0
                creditAmount: creditToUse
            };

            await registerPayment.mutateAsync(payload);
            setAmount(0);
            setCreditToUse(0);
            setReference('');
            setNotes('');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error registering payment:", error);
            showToast(error.message || "Error al registrar abono.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar Abono</DialogTitle>
                    <DialogDescription>
                        Pedido <strong>#{order?.receiptNumber}</strong> - Saldo: <span className="text-red-600 font-bold">{formatCurrency(pendingBalance)}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {totalCredit > 0 && (
                        <div className="space-y-2 p-3 bg-emerald-50 border border-emerald-100 rounded-md">
                            <label className="text-emerald-800 text-xs font-bold">Usar Saldo a Favor (Disponible: ${totalCredit.toFixed(2)})</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-2 top-1.5 text-xs text-emerald-600">$</span>
                                    <Input
                                        type="number"
                                        className="pl-5 h-8 bg-white border-emerald-200"
                                        placeholder="Monto a usar"
                                        value={creditToUse || ''}
                                        onChange={(e) => {
                                            const val = Math.min(Number(e.target.value), totalCredit, Math.max(0, pendingBalance - amount));
                                            setCreditToUse(val > 0 ? val : 0);
                                        }}
                                    />
                                </div>
                                {creditToUse > 0 ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-red-500 hover:bg-red-50"
                                        onClick={() => setCreditToUse(0)}
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
                                            const maxPossible = Math.min(totalCredit, Math.max(0, pendingBalance - amount));
                                            setCreditToUse(maxPossible);
                                        }}
                                    >
                                        Usar Máximo
                                    </Button>
                                )}
                            </div>
                            <p className="text-[10px] text-emerald-600">Este monto se descontará del saldo a favor del cliente.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount Input */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Monto a abonar</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount || ''}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                className="font-mono font-bold text-lg"
                            />
                        </div>

                        {/* Method Select */}
                        {amount > 0 && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Método</label>
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value as any)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="DEPOSITO">Depósito</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Reference and Bank Account (Conditional) */}
                    {amount > 0 && method !== 'EFECTIVO' && (
                        <>
                            <div className="space-y-1 animate-in fade-in">
                                <label className="text-sm font-medium text-blue-600">Cuenta Bancaria</label>
                                <select
                                    value={bankAccountId}
                                    onChange={(e) => setBankAccountId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    required={amount > 0}
                                >
                                    <option value="">Seleccionar cuenta...</option>
                                    {bankAccounts.filter(a => a.type !== 'CASH').map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} (Banco)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1 animate-in fade-in">
                                <label className="text-sm font-medium text-blue-600">Referencia / Comprobante</label>
                                <Input
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="Ref. bancaria obligatoria"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Auto Credit Preview */}
                    {creditGenerated > 0 && (
                        <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200">
                            <strong>Nota:</strong> Se generará un crédito a favor del cliente por <strong>{formatCurrency(creditGenerated)}</strong> automáticamente.
                        </div>
                    )}

                    <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm font-bold">
                            <span>Total a abonar:</span>
                            <span className="text-emerald-600">${(Number(amount) + Number(creditToUse)).toFixed(2)}</span>
                        </div>
                        {pendingBalance - (Number(amount) + Number(creditToUse)) > 0 && (
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Saldo pendiente tras abono: ${(pendingBalance - (Number(amount) + Number(creditToUse))).toFixed(2)}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-500">Observación (Opcional)</label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Detalle adicional..."
                            className="text-sm"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <AsyncButton type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </AsyncButton>
                        <AsyncButton
                            type="submit"
                            disabled={(amount <= 0 && creditToUse <= 0) || (amount > 0 && method !== 'EFECTIVO' && !bankAccountId)}
                            isLoading={isSubmitting}
                            loadingText="Procesando..."
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            Confirmar Abono
                        </AsyncButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
