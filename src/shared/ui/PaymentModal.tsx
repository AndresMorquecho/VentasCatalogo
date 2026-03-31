import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AsyncButton } from "@/shared/ui/async-button";
import { X, Plus, AlertTriangle, Wallet } from "lucide-react";
import { useBankAccountList } from "@/features/bank-accounts/api/hooks";
import { useClientCredit } from "@/features/wallet/model/hooks";
import { formatCurrency } from "@/entities/order/model/financialCalculator";
import { useAuth } from "@/shared/auth";
import { WalletRechargeQuick } from "@/shared/ui/WalletRechargeQuick";
import { paymentMethodConfigService, type PaymentMethodKey } from "@/shared/services/paymentMethodConfig";

export type PaymentMethod = PaymentMethodKey;

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
    lockAmount?: boolean; // Cuando true: total fijo, pero métodos de pago son editables y deben sumar al total
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

    // Load enabled payment methods from configuration (Requirement 8.1)
    const enabledMethods = useMemo(() => paymentMethodConfigService.getEnabledMethods(), []);
    const walletEnabled = useMemo(() => paymentMethodConfigService.isWalletEnabled(), []);

    // Validate at least one method is enabled (Requirement 8.4)
    const configError = useMemo(() => {
        if (enabledMethods.length === 0) {
            return 'No payment methods are currently enabled. Please contact your administrator.';
        }
        return null;
    }, [enabledMethods]);

    const [view, setView] = useState<'payment' | 'recharge'>('payment');
    const [validationError, setValidationError] = useState<string | null>(null);

    const [payments, setPayments] = useState<PaymentEntry[]>(() => {
        const cashAccount = bankAccountsResponse?.data?.find(a => a.type === 'CASH');
        const firstMethod = paymentMethodConfigService.getEnabledMethods()[0];
        const defaultMethod: PaymentMethod = (firstMethod?.key ?? 'EFECTIVO') as PaymentMethod;
        return [
            {
                id: '1',
                method: defaultMethod,
                amount: 0, // Siempre empezar en 0, no usar initialAmount por defecto
                bankAccountId: defaultMethod === 'EFECTIVO' ? (cashAccount?.id || '') : '',
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

    // Sincronizar el monto cuando abre el modal o initialAmount cambia
    useEffect(() => {
        if (open) {
            const cashAccount = bankAccountsResponse?.data?.find(a => a.type === 'CASH');
            const firstMethod = paymentMethodConfigService.getEnabledMethods()[0];
            const defaultMethod: PaymentMethod = (firstMethod?.key ?? 'EFECTIVO') as PaymentMethod;

            setPayments([{
                id: '1',
                method: defaultMethod,
                amount: initialAmount || 0,
                bankAccountId: defaultMethod === 'EFECTIVO' ? (cashAccount?.id || '') : '',
                transactionReference: '',
                notes: ''
            }]);
            
            setValidationError(null);
        }
    }, [open, initialAmount, bankAccountsResponse, enabledMethods]);

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    // En modo split: remaining puede ser negativo (overpaid) o positivo (underpaid)
    const remaining = lockAmount
        ? expectedAmount - totalAmount
        : Math.max(0, expectedAmount - totalAmount);
    const splitIsBalanced = lockAmount ? Math.abs(totalAmount - expectedAmount) <= 0.01 : true;

    const addPayment = () => {
        const newId = (payments.length + 1).toString();
        const cashAccount = bankAccounts.find(a => a.type === 'CASH');
        const firstMethod = enabledMethods[0];
        const defaultMethod: PaymentMethod = (firstMethod?.key ?? 'EFECTIVO') as PaymentMethod;
        setPayments(prev => [...prev, {
            id: newId,
            method: defaultMethod,
            amount: 0,
            bankAccountId: defaultMethod === 'EFECTIVO' ? (cashAccount?.id || '') : '',
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
                    } else if (updates.method === 'TRANSFERENCIA') {
                        const bankAccount = bankAccounts.find(a => a.type === 'BANK');
                        updatedPayment.bankAccountId = bankAccount?.id || '';
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

        // Validar que no haya más de un pago con BILLETERA_VIRTUAL
        const walletPayments = validPayments.filter(p => p.method === 'BILLETERA_VIRTUAL' && p.amount > 0);
        if (walletPayments.length > 1) {
            setValidationError('Solo se permite un método de pago con Billetera Virtual.');
            return;
        }

        // Validar cuentas bancarias para pagos no virtuales (solo si el monto es mayor a 0)
        for (const payment of validPayments) {
            if (payment.amount > 0) { // Solo validar si hay monto
                if (paymentMethodConfigService.getMethod(payment.method)?.requiresBankAccount && !payment.bankAccountId) {
                    setValidationError(`Debe seleccionar una cuenta bancaria para el pago ${payment.method}.`);
                    return;
                }
                
                if (paymentMethodConfigService.getMethod(payment.method)?.requiresReference && !payment.transactionReference?.trim()) {
                    setValidationError(`Debe ingresar una referencia para el pago ${payment.method}.`);
                    return;
                }

                // Validar saldo de billetera virtual (solo si wallet está habilitada)
                if (payment.method === 'BILLETERA_VIRTUAL' && walletEnabled && payment.amount > totalCredit) {
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

        // MODO SPLIT (lockAmount=true): La suma de métodos DEBE ser exactamente igual al total
        if (lockAmount && expectedAmount > 0) {
            const activePayments = validPayments.filter(p => p.amount > 0);
            if (Math.abs(totalAmount - expectedAmount) > 0.01) {
                setValidationError(
                    `La suma de los métodos de pago (${formatCurrency(totalAmount)}) debe ser exactamente igual al total (${formatCurrency(expectedAmount)}). ` +
                    `Diferencia: ${formatCurrency(Math.abs(expectedAmount - totalAmount))}`
                );
                return;
            }
            if (activePayments.length === 0) {
                setValidationError("Debe ingresar al menos un método de pago con monto mayor a 0.");
                return;
            }
        }

        // PERMITIR ABONOS PARCIALES - Validar que el total no exceda el saldo pendiente
        // Si expectedAmount es 0, no validar límite superior (caso de catálogos con precio libre)
        if (!lockAmount && expectedAmount > 0 && totalAmount > expectedAmount) {
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
        }
        if (['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'].includes(method)) {
            return bankAccounts.filter(acc => acc.type === 'BANK');
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
                        {view === 'recharge' ? 'Recargar Billetera' : 'Registrar Pago'}
                    </DialogTitle>
                </DialogHeader>

                {/* Validation Error Banner - Moved inside Resumen */}
                {view === 'payment' && configError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm font-medium mx-1">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                        <span>{configError}</span>
                    </div>
                )}

                {/* Recharge view */}
                {view === 'recharge' && paymentContext?.clientId && (
                    <div className="flex-1 overflow-y-auto px-1">
                        <WalletRechargeQuick
                            clientId={paymentContext.clientId}
                            onBack={() => setView('payment')}
                            onRechargeSuccess={(_rechargeId) => {
                                setView('payment');
                            }}
                        />
                    </div>
                )}

                {/* Payment view */}
                {view === 'payment' && (
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
                                {walletEnabled && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Billetera:</span>
                                        <span className="font-medium text-emerald-600">{formatCurrency(totalCredit)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="bg-monchito-purple/5 border border-monchito-purple/10 rounded-lg p-2 transition-all">
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
                                    <span className="text-slate-500">{(lockAmount || forceExactAmount) ? 'Diferencia:' : 'Restante:'}</span>
                                    <span className={`font-bold text-lg ${
                                        (lockAmount || forceExactAmount)
                                            ? Math.abs(totalAmount - expectedAmount) < 0.01 ? 'text-emerald-600' : 'text-red-600'
                                            : remaining > 0 ? 'text-red-600' : 'text-emerald-600'
                                    }`}>
                                        {(lockAmount || forceExactAmount) ? (remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`) : formatCurrency(remaining)}
                                    </span>
                                </div>
                                
                                {/* Live Error Messages */}
                                {(lockAmount || forceExactAmount) && Math.abs(totalAmount - expectedAmount) >= 0.01 && (
                                    <p className="text-[10px] text-red-500 italic flex items-center gap-1 mt-1 bg-red-50/50 rounded p-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {remaining > 0 ? `Falta distribuir ${formatCurrency(remaining)}` : `Excede por ${formatCurrency(Math.abs(remaining))}`}
                                    </p>
                                )}

                                {/* Submited Validation Error (if any) */}
                                {validationError && (
                                    <div className="mt-1 text-red-600 text-[10px] italic leading-tight">
                                        * {validationError}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Leyenda minimalista cuando el monto está bloqueado */}
                    {lockAmount && orderItems && orderItems.length > 1 && (
                        <p className="text-xs text-slate-500 italic font-bold text-center">
                            Distribuya el total entre los métodos de pago — la distribución por pedido ya está definida
                        </p>
                    )}

                    {/* Quick wallet recharge button — only shown when wallet is enabled (Requirement 8.5) */}
                    {walletEnabled && paymentContext?.clientId && (
                        <button
                            type="button"
                            onClick={() => setView('recharge')}
                            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-monchito-purple border border-dashed border-monchito-purple/40 rounded-lg py-2 hover:bg-monchito-purple/5 transition-colors mb-1"
                        >
                            <Wallet className="h-3.5 w-3.5" />
                            + Recargar billetera
                        </button>
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

                                    <div className="flex flex-wrap gap-3 items-end">
                                        {/* Método — only enabled methods are shown (Requirement 8.2) */}
                                        <div className="flex-1 min-w-[140px] space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-monchito-purple/60 px-1">Método</label>
                                            <select
                                                value={payment.method}
                                                onChange={(e) => updatePayment(payment.id, { 
                                                    method: e.target.value as PaymentMethod,
                                                    transactionReference: ''
                                                })}
                                                className="w-full h-9 px-3 rounded-xl border border-monchito-purple/20 bg-white text-xs focus:ring-2 focus:ring-monchito-purple/20 outline-none transition-all cursor-pointer"
                                            >
                                                {enabledMethods.map((methodConfig) => {
                                                    const isWalletAlreadyAdded =
                                                        methodConfig.isWallet &&
                                                        payment.method !== methodConfig.key &&
                                                        payments.some(
                                                            (p) => p.id !== payment.id && p.method === methodConfig.key
                                                        );
                                                    return (
                                                        <option
                                                            key={methodConfig.key}
                                                            value={methodConfig.key}
                                                            disabled={isWalletAlreadyAdded}
                                                            className="font-medium"
                                                        >
                                                            {methodConfig.key === 'BILLETERA_VIRTUAL'
                                                                ? `${methodConfig.label} (${formatCurrency(totalCredit)})${isWalletAlreadyAdded ? ' — ya agregada' : ''}`
                                                                : methodConfig.label}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        {/* Monto */}
                                        <div className="w-[130px] space-y-1 shrink-0">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-monchito-purple/60 px-1">Monto</label>
                                            <div className="relative group">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-monchito-purple/40 font-bold">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={expectedAmount > 0 ? expectedAmount : undefined}
                                                    value={payment.amount || ''}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || 0;
                                                        const limitedValue = (!lockAmount && expectedAmount > 0)
                                                            ? Math.min(value, expectedAmount)
                                                            : value;
                                                        updatePayment(payment.id, { amount: limitedValue });
                                                    }}
                                                    className="h-9 pl-6 pr-12 text-xs text-monchito-purple border-monchito-purple/20 rounded-xl bg-white focus:ring-2 focus:ring-monchito-purple/20 hide-spinner"
                                                    placeholder="0.00"
                                                />
                                                {expectedAmount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updatePayment(payment.id, { amount: remaining + payment.amount })}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-1.5 text-[9px] font-black uppercase tracking-tighter text-monchito-purple hover:bg-monchito-purple/10 rounded-lg transition-colors"
                                                    >
                                                        Max
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cuenta Bancaria — shown based on method config */}
                                        {paymentMethodConfigService.getMethod(payment.method)?.requiresBankAccount && (
                                            <div className="flex-1 min-w-[180px] space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-monchito-purple/60 px-1">Cuenta de Destino</label>
                                                <select
                                                    value={payment.bankAccountId || ''}
                                                    onChange={(e) => updatePayment(payment.id, { bankAccountId: e.target.value })}
                                                    className="w-full h-9 px-3 rounded-xl border border-monchito-purple/20 bg-white text-xs focus:ring-2 focus:ring-monchito-purple/20 outline-none transition-all cursor-pointer"
                                                    required
                                                >
                                                    <option value="" className="text-slate-400">Seleccionar cuenta...</option>
                                                    {getAvailableBankAccounts(payment.method).map(account => (
                                                        <option key={account.id} value={account.id}>
                                                            {account.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Referencia — shown based on method config */}
                                        {paymentMethodConfigService.getMethod(payment.method)?.requiresReference && (
                                            <div className="w-[150px] space-y-1 shrink-0">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-monchito-purple/60 px-1">Referencia</label>
                                                <Input
                                                    value={payment.transactionReference || ''}
                                                    onChange={(e) => updatePayment(payment.id, { transactionReference: e.target.value })}
                                                    placeholder="N° Ref..."
                                                    className="h-9 text-xs border-monchito-purple/20 rounded-xl bg-white"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Observaciones - Flexible */}
                                        <div className="flex-[2] min-w-[200px] space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-monchito-purple/60 px-1">Notas / Observaciones</label>
                                            <Input
                                                value={payment.notes || ''}
                                                onChange={(e) => updatePayment(payment.id, { notes: e.target.value })}
                                                placeholder="Notas opcionales..."
                                                className="h-9 text-xs border-monchito-purple/10 rounded-xl bg-slate-50 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Billetera Virtual Message */}
                                    {paymentMethodConfigService.getMethod(payment.method)?.isWallet && (
                                        <div className="text-xs text-slate-600 italic rounded px-2 py-1">
                                            Se descontará del saldo a favor del cliente
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                )}

                {/* Footer — solo en vista de pago */}
                {view === 'payment' && (
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
                        disabled={!!configError || totalAmount < 0 || (lockAmount && !splitIsBalanced)}
                        isLoading={isSubmitting}
                        loadingText="Procesando..."
                        className="bg-monchito-purple hover:bg-monchito-purple/90 h-8 px-4 text-xs"
                    >
                        {lockAmount
                            ? splitIsBalanced ? 'Registrar Pago' : `Falta ${formatCurrency(Math.abs(remaining))}`
                            : totalAmount === 0 ? 'Guardar sin Pago' : 'Registrar Pago'
                        }
                    </AsyncButton>
                </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
export default PaymentModal;