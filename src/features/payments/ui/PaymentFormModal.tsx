import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

import { usePaymentOperations } from "../model/hooks";
import { Loader2 } from "lucide-react";
import type { PaymentPayload } from "@/shared/api/paymentApi";

interface Props {
    order: {
        id: string;
        clientId: string;
        finalTotal: number;
        receiptNumber: string;
        totalPaid: number;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PaymentFormModal({ order, isOpen, onClose, onSuccess }: Props) {
    const { registerPayment } = usePaymentOperations();
    const [amount, setAmount] = useState<number>(0);
    const [method, setMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'DEPOSITO' | 'CREDITO_CLIENTE'>('EFECTIVO');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pendingBalance = order.finalTotal - order.totalPaid;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload: PaymentPayload = {
                orderId: order.id,
                clientId: order.clientId,
                amount: amount,
                method: method,
                referenceNumber: reference,
                notes: notes,
                createdBy: 'Operador'
            };

            await registerPayment.mutateAsync(payload);
            setAmount(0);
            setReference('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error registering payment:", error);
            // Show toast ideally
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
                        Pedido <strong>#{order.receiptNumber}</strong> - Saldo: <span className="text-red-600 font-bold">${pendingBalance.toFixed(2)}</span>
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
                    {method !== 'EFECTIVO' && (
                        <div className="space-y-1 animate-in fade-in">
                            <label className="text-sm font-medium text-blue-600">Referencia / Comprobante</label>
                            <Input
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Ref. bancaria obligatoria"
                                required
                            />
                        </div>
                    )}

                    {/* Auto Credit Preview */}
                    {amount > pendingBalance && (
                        <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200">
                            <strong>Nota:</strong> Se generará un crédito a favor del cliente por <strong>${(amount - pendingBalance).toFixed(2)}</strong> automáticamente.
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
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting || amount <= 0} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirmar Abono
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
