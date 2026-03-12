import { useState, useRef, useEffect, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogTitle
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { Truck, Plus, Trash2, Wallet, ReceiptText, AlertCircle } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { getPaidAmount } from "@/entities/order/model/model"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { useClientCredit } from "@/features/client-credits/model/hooks"
import { generateDeliveryReceipt } from "../lib/generateDeliveryReceipt"
import { useAuth } from "@/shared/auth/AuthProvider"
import { useNotifications } from "@/shared/lib/notifications"
import { logAction } from "@/shared/lib/auditService"

interface PaymentLine {
    id: string;
    method: string;
    amount: number;
    bankAccountId: string;
    reference: string;
}

interface DeliverOrderModalProps {
    order: Order | null;
    orders?: Order[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DeliverOrderModal({ order, orders = [], open, onOpenChange, onSuccess }: DeliverOrderModalProps) {
    const isBatch = orders.length > 0
    const activeOrders = isBatch ? orders : (order ? [order] : [])
    const firstOrder = activeOrders[0]
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isProcessingRef = useRef(false)

    // PAYMENT STATE
    const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([])

    const qc = useQueryClient()
    const { data: bankAccountsResponse } = useBankAccountList()
    const bankAccounts = bankAccountsResponse?.data || []
    const { data: creditData } = useClientCredit(firstOrder?.clientId || '')
    const { notifySuccess, notifyError } = useNotifications()
    const { user, hasPermission } = useAuth()

    // Financial calculations
    const totalEffective = useMemo(() => activeOrders.reduce((sum, o) => sum + (o.realInvoiceTotal ?? o.total), 0), [activeOrders])
    const totalPaidBefore = useMemo(() => activeOrders.reduce((sum, o) => sum + getPaidAmount(o), 0), [activeOrders])
    const totalAmountToCharge = Math.max(0, totalEffective - totalPaidBefore)
    
    const currentCreditAmount = creditData?.totalCredit || 0
    const hasCurrentCredit = currentCreditAmount > 0

    const currentPaymentsTotal = paymentLines.reduce((sum, p) => sum + p.amount, 0)
    const isMatchingTotal = Math.abs(currentPaymentsTotal - totalAmountToCharge) < 0.01

    // Initialize with one line if there's balance
    useEffect(() => {
        if (open && totalAmountToCharge > 0.01 && paymentLines.length === 0) {
            setPaymentLines([{
                id: crypto.randomUUID(),
                method: 'EFECTIVO',
                amount: totalAmountToCharge,
                bankAccountId: bankAccounts.find(a => a.type === 'CASH')?.id || '',
                reference: ''
            }])
        } else if (open && totalAmountToCharge <= 0.01) {
            setPaymentLines([])
        }
    }, [open, totalAmountToCharge, bankAccounts])

    if (activeOrders.length === 0) return null

    const addPaymentLine = () => {
        const remaining = Math.max(0, totalAmountToCharge - currentPaymentsTotal)
        setPaymentLines([...paymentLines, {
            id: crypto.randomUUID(),
            method: 'EFECTIVO',
            amount: remaining,
            bankAccountId: bankAccounts.find(a => a.type === 'CASH')?.id || '',
            reference: ''
        }])
    }

    const removePaymentLine = (id: string) => {
        setPaymentLines(paymentLines.filter(p => p.id !== id))
    }

    const updatePaymentLine = (id: string, updates: Partial<PaymentLine>) => {
        setPaymentLines(paymentLines.map(p => {
            if (p.id !== id) return p
            const updated = { ...p, ...updates }
            
            // Auto-select bank account if method changes
            if (updates.method) {
                if (updates.method === 'EFECTIVO') {
                    updated.bankAccountId = bankAccounts.find(a => a.type === 'CASH')?.id || ''
                } else {
                    updated.bankAccountId = ''
                }
            }
            return updated
        }))
    }

    const handleSubmit = async () => {
        if (!hasPermission('delivery.confirm')) {
            notifyError({ message: 'No tienes permiso para realizar entregas' })
            return
        }

        if (totalAmountToCharge > 0.01 && !isMatchingTotal) {
            notifyError({ message: `El monto total de pagos ($${currentPaymentsTotal.toFixed(2)}) debe coincidir con el saldo pendiente ($${totalAmountToCharge.toFixed(2)})` })
            return
        }

        // Validate each line
        for (const line of paymentLines) {
            if (line.method !== 'EFECTIVO' && line.method !== 'CREDITO_CLIENTE' && !line.bankAccountId) {
                notifyError({ message: "Seleccione una cuenta bancaria para pagos que no sean efectivo" })
                return
            }
            if (line.method !== 'EFECTIVO' && line.method !== 'CREDITO_CLIENTE' && !line.reference) {
                notifyError({ message: "Ingrese el número de referencia" })
                return
            }
            if (line.method === 'CREDITO_CLIENTE' && line.amount > currentCreditAmount + 0.01) {
                notifyError({ message: "Saldo a favor insuficiente para cubrir el monto del crédito" })
                return
            }
        }

        if (isProcessingRef.current) return
        isProcessingRef.current = true
        setIsSubmitting(true)

        try {
            const paymentsToSend = paymentLines.map(p => ({
                amount: p.amount,
                paymentMethod: p.method,
                bankAccountId: p.bankAccountId || undefined,
                reference: p.reference || undefined
            }))

            if (isBatch) {
                await orderApi.batchDeliver(activeOrders.map(o => o.id), paymentsToSend)
            } else {
                const deliveredOrder = await orderApi.deliverOrder(firstOrder.id, {
                    payments: paymentsToSend,
                    notes: `Entrega al cliente ${firstOrder.clientName}`
                });

                // PDF generation (simplified to main payment or first one)
                try {
                    await generateDeliveryReceipt(deliveredOrder, {
                        amountPaidNow: currentPaymentsTotal,
                        method: paymentLines.length > 1 ? 'MIXTO' : (paymentLines[0]?.method || 'EFECTIVO'),
                        user: deliveredOrder.deliveredByName || user?.username || 'Administrador',
                        currentCreditAmount: currentCreditAmount,
                        hasCurrentCredit: hasCurrentCredit
                    })
                } catch (pdfError) {
                    console.error("Error PDF", pdfError)
                }
            }

            qc.invalidateQueries({ queryKey: ['orders'] })
            qc.invalidateQueries({ queryKey: ['financial-records'] })
            qc.invalidateQueries({ queryKey: ['client-rewards'] })

            notifySuccess(`${isBatch ? 'Lote de entrega' : 'Entrega'} registrada correctamente`)

            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'UPDATE_ORDER',
                    module: 'orders',
                    detail: isBatch 
                        ? `Entrega lote (${activeOrders.length} pedidos). Cliente: ${firstOrder.clientName}. Total cobrado: $${currentPaymentsTotal.toFixed(2)}`
                        : `Entregó pedido ${firstOrder.receiptNumber}. Cliente: ${firstOrder.clientName}. Total cobrado: $${currentPaymentsTotal.toFixed(2)}`
                });
            }

            if (onSuccess) onSuccess()
            onOpenChange(false)
        } catch (error) {
            notifyError(error, "Error al procesar la entrega")
        } finally {
            setIsSubmitting(false)
            isProcessingRef.current = false
        }
    }

    const formatCurrency = (val: number) => `$${val.toFixed(2)}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl flex flex-col max-h-[92vh] w-[95vw]">
                {/* Header - Matching Empresaria Modal Style */}
                <div className="bg-[#f8f5f9] px-8 py-5 flex items-center justify-between shrink-0 border-b border-slate-100 relative">
                    <div className="flex items-center gap-4">
                        <div className="bg-monchito-purple/10 p-2.5 rounded-xl shadow-sm">
                            <Truck className="h-5 w-5 text-monchito-purple" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                                    {isBatch ? 'Entrega por Lote' : 'Entrega de Pedido'}
                                </DialogTitle>
                                <span className="bg-monchito-purple/10 text-monchito-purple text-[10px] font-black px-2 py-0.5 rounded-full border border-monchito-purple/10 uppercase">
                                    {activeOrders.length} {activeOrders.length === 1 ? 'Pedido' : 'Pedidos'}
                                </span>
                            </div>
                            <p className="text-slate-500 text-xs font-medium">
                                {isBatch ? 'Procesando múltiples entregas' : 'Finalización de orden y liquidación de saldos'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Client Info Info - Standard Label style */}
                    <div className="hidden sm:flex flex-col items-end pr-8">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Empresaria</span>
                        <span className="font-bold text-monchito-purple text-base leading-none">{firstOrder.clientName}</span>
                    </div>
                </div>

                {/* Main Content - Harmonized */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="p-8 space-y-8">
                        {/* KPI Cards - Refined Brand Aligned */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4 transition-all hover:bg-white hover:shadow-md">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                                    <ReceiptText className="h-6 w-6 text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Facturado</span>
                                    <span className="text-xl font-black text-slate-900 leading-none">{formatCurrency(totalEffective)}</span>
                                </div>
                            </div>

                            <div className="bg-[#f0f9f9] p-5 rounded-3xl border border-monchito-teal/10 flex items-center gap-4 transition-all hover:bg-white hover:shadow-md">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-monchito-teal/10">
                                    <Wallet className="h-6 w-6 text-monchito-teal" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-monchito-teal uppercase tracking-widest leading-none mb-2">Abonado</span>
                                    <span className="text-xl font-black text-monchito-teal leading-none">{formatCurrency(totalPaidBefore)}</span>
                                </div>
                            </div>

                            <div className="bg-[#f7f3f8] p-5 rounded-3xl border border-monchito-purple/10 flex items-center justify-between transition-all hover:bg-white hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-monchito-purple/10">
                                        <AlertCircle className="h-6 w-6 text-monchito-purple" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-monchito-purple uppercase tracking-widest leading-none mb-2">Pendiente</span>
                                        <span className={`text-2xl font-black leading-none ${totalAmountToCharge > 0.01 ? 'text-monchito-purple' : 'text-slate-300'}`}>
                                            {formatCurrency(totalAmountToCharge)}
                                        </span>
                                    </div>
                                </div>
                                {hasCurrentCredit && (
                                    <div className="bg-monchito-teal text-white px-2.5 py-1 rounded-xl text-[10px] font-black shadow-lg">
                                        SDO: {formatCurrency(currentCreditAmount)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Section - Section Style Matching Empresaria Modal */}
                        {totalAmountToCharge > 0.01 && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <div className="bg-monchito-purple/10 p-1 rounded-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-monchito-purple" />
                                        </div> 
                                        Información de Pago
                                    </h3>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={addPaymentLine} 
                                        className="h-10 px-6 text-xs font-bold text-monchito-purple border-monchito-purple/20 hover:bg-monchito-purple/5 rounded-2xl uppercase tracking-widest transition-all"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> 
                                        Nuevo Método
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {paymentLines.map((line) => {
                                        const needsReference = line.method !== 'EFECTIVO' && line.method !== 'CREDITO_CLIENTE';
                                        
                                        return (
                                            <div key={line.id} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 transition-all group hover:border-monchito-purple/30 shadow-sm hover:shadow-lg">
                                                <div className="w-[18%] min-w-[140px] space-y-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Método</span>
                                                    <select
                                                        value={line.method}
                                                        onChange={(e) => updatePaymentLine(line.id, { method: e.target.value })}
                                                        className="w-full h-11 border border-slate-200 rounded-2xl px-4 text-sm bg-white outline-none font-bold text-slate-700 focus:ring-2 focus:ring-monchito-purple/20 transition-all cursor-pointer"
                                                    >
                                                        <option value="EFECTIVO">Efectivo</option>
                                                        <option value="TRANSFERENCIA">Transferencia</option>
                                                        <option value="DEPOSITO">Depósito</option>
                                                        <option value="CHEQUE">Cheque</option>
                                                        <option value="CREDITO_CLIENTE">Saldo a Favor</option>
                                                    </select>
                                                </div>

                                                <div className={`${needsReference ? 'w-[28%]' : 'w-[56%]'} space-y-2 transition-all`}>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cuenta Destino</span>
                                                    <select
                                                        value={line.bankAccountId}
                                                        onChange={(e) => updatePaymentLine(line.id, { bankAccountId: e.target.value })}
                                                        disabled={line.method === 'CREDITO_CLIENTE'}
                                                        className="w-full h-11 border border-slate-200 rounded-2xl px-4 text-sm bg-white outline-none font-bold text-slate-600 disabled:opacity-30 disabled:bg-transparent focus:ring-2 focus:ring-monchito-purple/20 transition-all cursor-pointer"
                                                    >
                                                        <option value="">Cuenta...</option>
                                                        {bankAccounts
                                                            .filter(acc => {
                                                                if (line.method === 'EFECTIVO') return acc.type === 'CASH';
                                                                if (line.method === 'TRANSFERENCIA' || line.method === 'DEPOSITO') return acc.type === 'BANK';
                                                                return true;
                                                            })
                                                            .map(acc => (
                                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>

                                                {needsReference && (
                                                    <div className="flex-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Referencia</span>
                                                        <Input 
                                                            value={line.reference}
                                                            onChange={(e) => updatePaymentLine(line.id, { reference: e.target.value })}
                                                            placeholder="N° Comprobante"
                                                            className="h-11 rounded-2xl border-slate-200 text-sm font-medium focus:ring-2 focus:ring-monchito-purple/20 shadow-sm"
                                                        />
                                                    </div>
                                                )}

                                                <div className="w-[140px] space-y-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Monto</span>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-3 text-slate-400 text-xs font-black">$</span>
                                                        <Input 
                                                            type="number"
                                                            value={line.amount}
                                                            onChange={(e) => updatePaymentLine(line.id, { amount: parseFloat(e.target.value) || 0 })}
                                                            className="pl-8 h-11 rounded-2xl border-slate-200 font-black text-monchito-purple text-base focus:ring-2 focus:ring-monchito-purple/20 shadow-inner"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-6">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => removePaymentLine(line.id)}
                                                        disabled={paymentLines.length === 1}
                                                        className="h-11 w-11 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Order Validation Status */}
                        {totalAmountToCharge > 0.01 && (
                            <div className={`p-6 rounded-3xl flex items-center justify-between border transition-all duration-300 ${isMatchingTotal ? 'bg-[#f0f9f9] border-monchito-teal/20 text-monchito-teal shadow-sm' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`p-3.5 rounded-2xl shadow-sm ${isMatchingTotal ? 'bg-monchito-teal text-white' : 'bg-white text-rose-500 animate-pulse border border-rose-100'}`}>
                                        <Wallet className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-base font-black uppercase tracking-tight leading-none mb-1.5">{isMatchingTotal ? 'Cobro Validado' : 'Monto Incompleto'}</p>
                                        <p className="text-sm font-bold opacity-70">
                                            {isMatchingTotal 
                                                ? 'Se ha cubierto el saldo. Puede procesar la entrega.' 
                                                : `Se requiere registrar ${formatCurrency(totalAmountToCharge)} para completar.`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] leading-none mb-1.5">Total Registrado</span>
                                    <span className={`text-3xl font-black tracking-tighter ${isMatchingTotal ? 'text-monchito-teal' : 'text-slate-900'}`}>{formatCurrency(currentPaymentsTotal)}</span>
                                </div>
                            </div>
                        )}

                        {!totalAmountToCharge && (
                            <div className="bg-slate-900 p-8 rounded-3xl flex items-center gap-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-monchito-purple/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
                                <div className="bg-monchito-purple p-4 rounded-2xl shadow-lg relative z-10">
                                    <Truck className="h-8 w-8 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <p className="font-black text-sm uppercase tracking-[0.4em] leading-none mb-2 text-monchito-gold">Autorización Exitosa</p>
                                    <p className="text-base font-bold text-slate-300">Este lote está liquidado. Puede proceder con el despacho físico ahora mismo.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Style - Matching Empresaria Modal precisely */}
                <div className="bg-white px-8 py-6 border-t border-slate-100 shrink-0 flex items-center justify-end gap-8">
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="text-slate-900 font-bold hover:text-monchito-purple text-xs uppercase tracking-[0.2em] transition-all"
                    >
                        Cerrar
                    </button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (totalAmountToCharge > 0.01 && !isMatchingTotal)}
                        className="min-w-[280px] h-12 px-10 rounded-2xl bg-monchito-purple hover:bg-[#4a144e] text-white font-bold uppercase tracking-[0.15em] text-xs shadow-xl active:scale-[0.98] transition-all"
                    >
                        {isSubmitting ? 'Procesando...' : (totalAmountToCharge > 0.01 ? 'Registrar y Entregar' : 'Confirmar Entrega')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
