import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AsyncButton } from "@/shared/ui/async-button";
import { X, Plus, AlertTriangle } from "lucide-react";
import { useBankAccountList } from "@/features/bank-accounts/api/hooks";
import { useClientCredit } from "@/features/wallet/model/hooks";
import { formatCurrency } from "@/entities/order/model/financialCalculator";
import { useAuth } from "@/shared/auth";

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE' | 'BILLETERA_VIRTUAL';

export interface PaymentEntry {
    id: string;
    method: PaymentMethod;
    amount: number;
    bankAccountId?: string;
    transactionReference?: string;
    notes?: string;
}

export interface PaymentModalData {
    payments: PaymentEntry[];
}

export interface PaymentContext {
    type: "PEDIDO" | "ABONO";
    clientId: string;
    clientName: string;
    referenceNumber: string;
    description: string;
}

export interface OrderItem {
    id: string;
    brandName: string;
    total: number;
    currentDeposit: number;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: PaymentModalData) => Promise<void>;
    paymentContext: PaymentContext;
    expectedAmount: number;
    allowMultiplePayments?: boolean;
    initialAmount?: number; // Monto precargado desde la página previa
    orderItems?: OrderItem[]; // Lista de pedidos para mostrar información
    lockAmount?: boolean; // Bloquear el campo de monto cuando hay múltiples pedidos
    forceExactAmount?: boolean; // Forzar que el pago sea exactamente igual al monto esperado
}

export function PaymentModal({
    open,
    onOpenChange,
    onSubmit,
    paymentContext,
    expectedAmount,
    allowMultiplePayments = true,
    initialAmount,
    orderItems,
    lockAmount = false,
    forceExactAmount = false
}: Props) {
    const { data: bankAccountsResponse } = useBankAccountList();
    const bankAccounts = bankAccountsResponse?.data || [];
    const { data: creditData } = useClientCredit(paymentContext?.clientId || "");
    const totalCredit = creditData?.totalCredit || 0;
    
    const [validationError, setValidationError] = useState<string | null>(null);

    const [payments, setPayments] = useState<PaymentEntry[]>(() => {
        const cashAccount = bankAccountsResponse?.data?.find(a => a.type === 'CASH');
        return [
            {
                id: '1',
                method: 'EFECTIVO',
                amount: 0, // Siempre empezar en 0, no usar initialAmount por defecto
                bankAccountId: cashAccount?.id || '',
                transactionReference: '',
                notes: ''
            }
        ];
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user } = useAuth();

    // Debug logging para verificar datos de billetera
    console.log('PaymentModal - Client ID:', paymentContext?.clientId);
    console.log('PaymentModal - Credit data:', creditData);
    console.log('PaymentModal - Total credit calculated:', totalCredit);

    // Actualizar el monto cuando cambie initialAmount (solo si se proporciona)
    useEffect(() => {
        if (initialAmount && initialAmount > 0) {
            setPayments(prev => {
                const firstPayment = prev[0];
                if (firstPayment && firstPayment.amount !== initialAmount) {
                    return prev.map((payment, index) => 
                        index === 0 ? { ...payment, amount: initialAmount } : payment
                    );
                }
                return prev;
            });
        }
    }, [initialAmount]);

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(0, expectedAmount - totalAmount);

    const addPayment = () => {
        const newId = (payments.length + 1).toString();
        const cashAccount = bankAccounts.find(a => a.type === 'CASH');
        setPayments(prev => [...prev, {
            id: newId,
            method: 'EFECTIVO',
            amount: 0,
            bankAccountId: cashAccount?.id || '',
            transactionReference: '',
            notes: ''
        }]);
    };

    const removePayment = (id: string) => {
        if (payments.length > 1) {
            setPayments(prev => prev.filter(p => p.id !== id));
        }
    };

    const updatePayment = (id: string, updates: Partial<PaymentEntry>) => {
        setValidationError(null);
        setPayments(prev => prev.map(p => {
            if (p.id === id) {
                const updatedPayment = { ...p, ...updates };
                
                // Auto-select bank account when method changes
                if (updates.method) {
                    if (updates.method === 'EFECTIVO') {
                        const cashAccount = bankAccounts.find(a => a.type === 'CASH');
                        updatedPayment.bankAccountId = cashAccount?.id || '';
                    } else if (updates.method === 'BILLETERA_VIRTUAL') {
                        updatedPayment.bankAccountId = '';
                    } else if (!updatedPayment.bankAccountId) {
                        const bankAccount = bankAccounts.find(a => a.type === 'BANK');
                        updatedPayment.bankAccountId = bankAccount?.id || '';
                    }
                }
                
                return updatedPayment;
            }
            return p;
        }));
    };

    const handleSubmit = async () => {
        setValidationError(null);

        // Validaciones básicas - PERMITIR ABONOS DE 0
        const validPayments = payments.filter(p => p.amount >= 0); // Cambio: >= 0 en lugar de > 0
        
        if (validPayments.length === 0) {
            setValidationError("Debe agregar al menos un método de pago.");
            return;
        }

        // Validar cuentas bancarias para pagos no virtuales (solo si el monto es mayor a 0)
        for (const payment of validPayments) {
            if (payment.amount > 0) { // Solo validar si hay monto
                if (payment.method !== 'BILLETERA_VIRTUAL' && !payment.bankAccountId) {
                    setValidationError(`Debe seleccionar una cuenta bancaria para el pago ${payment.method}.`);
                    return;
                }
                
                if (payment.method !== 'EFECTIVO' && payment.method !== 'BILLETERA_VIRTUAL' && !payment.transactionReference?.trim()) {
                    setValidationError(`Debe ingresar una referencia para el pago ${payment.method}.`);
                    return;
                }

                // Validar saldo de billetera virtual
                if (payment.method === 'BILLETERA_VIRTUAL' && payment.amount > totalCredit) {
                    setValidationError(`Saldo insuficiente en billetera virtual. Disponible: ${formatCurrency(totalCredit)}`);
                    return;
                }

                // Validar que el monto individual no sea mayor al saldo pendiente (solo si expectedAmount > 0)
                if (expectedAmount > 0 && payment.amount > expectedAmount) {
                    setValidationError(`El monto de ${formatCurrency(payment.amount)} excede el saldo pendiente de ${formatCurrency(expectedAmount)}.`);
                    return;
                }
            }
        }

        // PERMITIR ABONOS PARCIALES - Validar que el total no exceda el saldo pendiente
        // Si expectedAmount es 0, no validar límite superior (caso de catálogos con precio libre)
        if (expectedAmount > 0 && totalAmount > expectedAmount) {
            setValidationError(`El monto total de ${formatCurrency(totalAmount)} excede el saldo pendiente de ${formatCurrency(expectedAmount)}.`);
            return;
        }

        // Validar que no sea negativo (ya está cubierto por el filter >= 0)
        if (totalAmount < 0) {
            setValidationError("El monto total no puede ser negativo.");
            return;
        }

        // REGLA FASE 3: Forzar monto exacto si se solicita (Ej. para entregas)
        if (forceExactAmount && Math.abs(totalAmount - expectedAmount) > 0.01) {
            setValidationError(`Se requiere cancelar el valor exacto del saldo pendiente: ${formatCurrency(expectedAmount)}. Monto actual: ${formatCurrency(totalAmount)}`);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ payments: validPayments });
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting payments:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAvailableBankAccounts = (method: PaymentMethod) => {
        if (method === 'EFECTIVO') {
            return bankAccounts.filter(acc => acc.type === 'CASH');
        } else if (method === 'TRANSFERENCIA' || method === 'DEPOSITO') {
            return bankAccounts.filter(acc => acc.type === 'BANK');
        } else if (method === 'CHEQUE') {
            return bankAccounts; // All accounts
        }
        return [];
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-monchito-purple rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">$</span>
                        </div>
                        Registrar Pago
                    </DialogTitle>
                </DialogHeader>

                {/* Validation Error Banner */}
                {validationError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm font-medium mx-1">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                        <span>{validationError}</span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* Información */}
                        <div className="bg-monchito-purple/5 border border-monchito-purple/10 rounded-lg p-2">
                            <h3 className="text-monchito-purple text-xs font-black uppercase tracking-widest mb-1">
                                Información
                            </h3>
                            <div className="space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Registrado por:</span>
                                    <span className="font-medium">{user?.username || 'Sistema'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tipo:</span>
                                    <span className="font-medium">{paymentContext.type === 'PEDIDO' ? 'Abono a pedido' : 'Abono posterior'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cliente:</span>
                                    <span className="font-medium">{paymentContext.clientName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Referencia:</span>
                                    <span className="font-medium text-monchito-purple">#{paymentContext.referenceNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Billetera:</span>
                                    <span className="font-medium text-emerald-600">{formatCurrency(totalCredit)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="bg-monchito-purple/5 border border-monchito-purple/10 rounded-lg p-2">
                            <h3 className="text-monchito-purple text-xs font-black uppercase tracking-widest mb-1">
                                Resumen
                            </h3>
                            <div className="space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Monto total:</span>
                                    <span className="font-bold text-lg">{formatCurrency(expectedAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Abonado:</span>
                                    <span className="font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-0.5">
                                    <span className="text-slate-500">Restante:</span>
                                    <span className={`font-bold text-lg ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatCurrency(remaining)}
                                    </span>
                                </div>
                                {remaining <= 0 && (
                                    <p className="text-xs text-emerald-600 italic">El total está cubierto</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Leyenda minimalista cuando el monto está bloqueado */}
                    {lockAmount && orderItems && orderItems.length > 1 && (
                        <p className="text-xs text-slate-500 italic font-bold text-center">
                            Para modificar el monto, cierre este modal y ajuste los abonos individuales en la tabla
                        </p>
                    )}

                    {/* Métodos de Pago */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-monchito-purple text-xs font-black uppercase tracking-widest">
                                Métodos de Pago
                            </h3>
                            {allowMultiplePayments && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addPayment}
                                    className="text-monchito-purple border-monchito-purple hover:bg-monchito-purple/5 h-7 px-2 text-xs"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Agregar
                                </Button>
                            )}
                        </div>

                        <div className={`space-y-2 ${payments.length > 2 ? 'max-h-64 overflow-y-auto pr-2' : ''}`}>
                            {payments.map((payment, index) => (
                                <div key={payment.id} className="border border-slate-200 rounded-lg p-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Pago {index + 1}
                                        </span>
                                        {payments.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removePayment(payment.id)}
                                                className="text-red-500 hover:bg-red-50 h-6 w-6 p-0"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                                        {/* Método */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Método</label>
                                            <select
                                                value={payment.method}
                                                onChange={(e) => updatePayment(payment.id, { 
                                                    method: e.target.value as PaymentMethod,
                                                    transactionReference: '' // Reset reference when method changes
                                                })}
                                                className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                                            >
                                                <option value="EFECTIVO">Efectivo</option>
                                                <option value="TRANSFERENCIA">Transferencia</option>
                                                <option value="DEPOSITO">Depósito</option>
                                                <option value="CHEQUE">Cheque</option>
                                                <option value="BILLETERA_VIRTUAL">
                                                    Billetera Virtual ({formatCurrency(totalCredit)})
                                                </option>
                                            </select>
                                        </div>

                                        {/* Monto - Más pequeño con botón */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Monto</label>
                                            <div className="flex gap-1">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={expectedAmount > 0 ? expectedAmount : undefined}
                                                    value={payment.amount || ''}
                                                    onChange={(e) => {
                                                        if (lockAmount) return; // Bloquear si lockAmount es true
                                                        const value = parseFloat(e.target.value) || 0;
                                                        // Limitar al saldo pendiente solo si expectedAmount > 0
                                                        const limitedValue = expectedAmount > 0 ? Math.min(value, expectedAmount) : value;
                                                        updatePayment(payment.id, { amount: limitedValue });
                                                    }}
                                                    className={`h-8 text-xs font-mono flex-1 ${lockAmount ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                                    placeholder="0.00"
                                                    disabled={lockAmount}
                                                    readOnly={lockAmount}
                                                />
                                                {!lockAmount && expectedAmount > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updatePayment(payment.id, { amount: remaining })}
                                                        className="h-8 px-2 text-xs"
                                                        title="Usar saldo restante"
                                                    >
                                                        Max
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cuenta Bancaria (condicional) */}
                                        {payment.method !== 'BILLETERA_VIRTUAL' && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-blue-600">Cuenta de Destino</label>
                                                <select
                                                    value={payment.bankAccountId || ''}
                                                    onChange={(e) => updatePayment(payment.id, { bankAccountId: e.target.value })}
                                                    className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                                                    required
                                                >
                                                    <option value="">Seleccionar cuenta...</option>
                                                    {getAvailableBankAccounts(payment.method).map(account => (
                                                        <option key={account.id} value={account.id}>
                                                            {account.name} ({account.type === 'CASH' ? 'Efectivo' : 'Banco'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Referencia (condicional) */}
                                        {payment.method !== 'EFECTIVO' && payment.method !== 'BILLETERA_VIRTUAL' && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-blue-600">Referencia</label>
                                                <Input
                                                    value={payment.transactionReference || ''}
                                                    onChange={(e) => updatePayment(payment.id, { transactionReference: e.target.value })}
                                                    placeholder="Número de referencia"
                                                    className="h-8 text-xs"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Observaciones - Más grande */}
                                        <div className="space-y-1 sm:col-span-3">
                                            <label className="text-xs font-medium text-slate-500">Notas</label>
                                            <Input
                                                value={payment.notes || ''}
                                                onChange={(e) => updatePayment(payment.id, { notes: e.target.value })}
                                                placeholder="Observación opcional..."
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Billetera Virtual Message */}
                                    {payment.method === 'BILLETERA_VIRTUAL' && (
                                        <div className="text-xs text-slate-600 italic rounded px-2 py-1">
                                            Se descontará del saldo a favor del cliente
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="h-8 px-4 text-xs"
                    >
                        Cancelar
                    </Button>
                    <AsyncButton
                        onClick={handleSubmit}
                        disabled={totalAmount < 0}
                        isLoading={isSubmitting}
                        loadingText="Procesando..."
                        className="bg-monchito-purple hover:bg-monchito-purple/90 h-8 px-4 text-xs"
                    >
                        {totalAmount === 0 ? 'Guardar sin Pago' : 'Registrar Pago'}
                    </AsyncButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
export default PaymentModal;