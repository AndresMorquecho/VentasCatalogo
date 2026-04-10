import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AsyncButton } from "@/shared/ui/async-button";
import { AlertTriangle, Wallet, RefreshCw } from "lucide-react";
import { useBankAccountList } from "@/features/bank-accounts/api/hooks";
import { useClientCredit } from "@/features/wallet/model/hooks";
import { formatCurrency } from "@/entities/order/model/financialCalculator";
import { useAuth } from "@/shared/auth";
import { WalletRechargeQuick } from "@/shared/ui/WalletRechargeQuick";
import { paymentMethodConfigService, type PaymentMethodKey } from "@/shared/services/paymentMethodConfig";
import type { Permission } from "@/shared/lib/permissions";

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
    initialAmount?: number; // Monto precargado desde la página previa
    orderItems?: OrderItem[]; // Lista de pedidos para mostrar información
    lockAmount?: boolean; // Cuando true: total fijo, pero métodos de pago son editables y deben sumar al total
    forceExactAmount?: boolean; // Forzar que el pago sea exactamente igual al monto esperado
    saveWithZeroPermission?: Permission; // Permiso requerido para guardar con monto 0 cuando hay saldo pendiente
}

export function PaymentModal({
    open,
    onOpenChange,
    onSubmit,
    paymentContext,
    expectedAmount,
    initialAmount,
    lockAmount = false,
    forceExactAmount = false,
    saveWithZeroPermission
}: Props) {
    const { data: bankAccountsResponse } = useBankAccountList();
    const qc = useQueryClient();
    const { hasPermission } = useAuth();
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
                amount: 0, 
                bankAccountId: defaultMethod === 'EFECTIVO' ? (cashAccount?.id || '') : '',
                transactionReference: '',
                notes: ''
            }
        ];
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user } = useAuth();

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
    const remaining = lockAmount
        ? expectedAmount - totalAmount
        : Math.max(0, expectedAmount - totalAmount);
    const splitIsBalanced = lockAmount ? Math.abs(totalAmount - expectedAmount) <= 0.01 : true;

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
        const validPayments = payments.filter(p => p.amount >= 0);
        
        if (validPayments.length === 0) {
            setValidationError("Debe ingresar un método de pago válido.");
            return;
        }

        // Validar cuentas bancarias para pagos no virtuales (solo si el monto es mayor a 0)
        for (const payment of validPayments) {
            if (payment.amount > 0) { // Solo validar si hay monto
                if (paymentMethodConfigService.getMethod(payment.method)?.requiresBankAccount && !payment.bankAccountId) {
                    setValidationError(`Debe seleccionar una cuenta bancaria para el pago.`);
                    return;
                }
                
                if (paymentMethodConfigService.getMethod(payment.method)?.requiresReference && !payment.transactionReference?.trim()) {
                    setValidationError(`Debe ingresar una referencia para el pago.`);
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
            if (Math.abs(totalAmount - expectedAmount) > 0.01) {
                setValidationError(
                    `El monto ingresado (${formatCurrency(totalAmount)}) debe ser exactamente igual al total (${formatCurrency(expectedAmount)}). `
                );
                return;
            }
        }

        // PERMITIR ABONOS PARCIALES - Validar que el total no exceda el saldo pendiente
        if (!lockAmount && expectedAmount > 0 && totalAmount > expectedAmount) {
            setValidationError(`El monto de ${formatCurrency(totalAmount)} excede el saldo pendiente de ${formatCurrency(expectedAmount)}.`);
            return;
        }

        // REGLA FASE 3: Forzar monto exacto si se solicita (Ej. para entregas)
        if (forceExactAmount && Math.abs(totalAmount - expectedAmount) > 0.01) {
            setValidationError(`Se requiere cancelar el valor exacto del saldo pendiente: ${formatCurrency(expectedAmount)}.`);
            return;
        }

        // VALIDACIÓN DE PERMISO PARA GUARDAR SIN PAGO (ABONO 0)
        if (totalAmount === 0 && expectedAmount > 0 && saveWithZeroPermission && !hasPermission(saveWithZeroPermission)) {
            setValidationError("No tiene permiso para guardar documentos sin abono inicial.");
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

                {view === 'payment' && configError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm font-medium mx-1">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                        <span>{configError}</span>
                    </div>
                )}

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
                                
                                {validationError && (
                                    <div className="mt-1 text-red-600 text-[10px] italic leading-tight">
                                        * {validationError}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {walletEnabled && paymentContext?.clientId && (
                        <div className="flex gap-2 mb-2 items-stretch">
                            <button
                                type="button"
                                onClick={() => setView('recharge')}
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-monchito-purple border border-dashed border-monchito-purple/40 rounded-lg py-2 hover:bg-monchito-purple/5 transition-colors"
                            >
                                <Wallet className="h-3.5 w-3.5" />
                                + Recargar billetera
                            </button>
                            
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    qc.invalidateQueries({ queryKey: ["client-credit"] });
                                    qc.invalidateQueries({ queryKey: ["client-credits"] });
                                }}
                                title="Actualizar saldo de billetera"
                                className="px-3 border-monchito-purple/20 text-monchito-purple hover:bg-monchito-purple/5 group"
                            >
                                <RefreshCw className="h-3.5 w-3.5 group-active:animate-spin" />
                            </Button>
                        </div>
                    )}

                    {/* Métodos de Pago */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-monchito-purple text-xs font-black uppercase tracking-widest">
                                Método de Pago
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {payments.map((payment) => (
                                <div key={payment.id} className="border border-slate-200 rounded-lg p-3 space-y-3">
                                    <div className="flex flex-wrap gap-3 items-end">
                                        {/* Método */}
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
                                                {enabledMethods.map((methodConfig) => (
                                                    <option
                                                        key={methodConfig.key}
                                                        value={methodConfig.key}
                                                        className="font-medium"
                                                    >
                                                        {methodConfig.key === 'BILLETERA_VIRTUAL'
                                                            ? `${methodConfig.label} (${formatCurrency(totalCredit)})`
                                                            : methodConfig.label}
                                                    </option>
                                                ))}
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
                                                    value={payment.amount === 0 ? '' : payment.amount}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value;
                                                        const value = rawValue === '' ? 0 : parseFloat(rawValue) || 0;
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

                                        {/* Cuenta Bancaria */}
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

                                        {/* Referencia */}
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

                                        {/* Observaciones */}
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

                {/* Footer */}
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