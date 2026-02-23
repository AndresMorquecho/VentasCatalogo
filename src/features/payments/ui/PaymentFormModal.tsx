import { useState, useMemo, useEffect } from "react";
import { AsyncButton } from "@/shared/ui/async-button";
import { Input } from "@/shared/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { useBankAccountList } from "@/features/bank-accounts/api/hooks";
import { usePaymentOperations } from "../model/hooks";
import type { PaymentPayload } from "@/shared/api/paymentApi";
import { calculateCreditFromPayment, formatCurrency } from "@/entities/order/model/financialCalculator";
import type { Order } from "@/entities/order/model/types";
import { useToast } from "@/shared/ui/use-toast";

interface Props {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PaymentFormModal({ order, isOpen, onClose, onSuccess }: Props) {
    const { registerPayment } = usePaymentOperations();
    const { data: bankAccounts = [] } = useBankAccountList();
    const [amount, setAmount] = useState<number>(0);
    const [method, setMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'DEPOSITO' | 'CREDITO_CLIENTE'>('EFECTIVO');
    const [bankAccountId, setBankAccountId] = useState<string>('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    // Use centralized financial calculator
    const pendingBalance = useMemo(() => {
        if (!order) return 0;
        const total = Number(order.realInvoiceTotal ?? order.total ?? 0);
        const paid = order.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        return Math.max(0, total - paid);
    }, [order]);

    // Calculate credit if payment exceeds pending
    const creditGenerated = useMemo(() =>
        calculateCreditFromPayment(order, amount),
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
        setIsSubmitting(true);

        try {
            const payload: PaymentPayload = {
                orderId: order.id,
                amount: amount,
                method: method,
                referenceNumber: reference,
                notes: notes,
                bankAccountId: bankAccountId
            };

            await registerPayment.mutateAsync(payload);
            setAmount(0);
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
                        Pedido <strong>#{order.receiptNumber}</strong> - Saldo: <span className="text-red-600 font-bold">{formatCurrency(pendingBalance)}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount Input */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Monto a abonar</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value))}
                                className="font-mono font-bold text-lg"
                                required
                            />
                        </div>

                        {/* Method Select */}
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
                                <option value="CREDITO_CLIENTE">Crédito a Favor</option>
                            </select>
                        </div>
                    </div>

                    {/* Reference Input (Conditional) */}
                    {method !== 'EFECTIVO' && method !== 'CREDITO_CLIENTE' && (
                        <>
                            <div className="space-y-1 animate-in fade-in">
                                <label className="text-sm font-medium text-blue-600">Cuenta Bancaria</label>
                                <select
                                    value={bankAccountId}
                                    onChange={(e) => setBankAccountId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    required
                                >
                                    <option value="">Seleccionar cuenta...</option>
                                    {bankAccounts.filter(a => a.type === 'BANK').map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} - {account.accountNumber}
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
                            disabled={amount <= 0 || !bankAccountId}
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
