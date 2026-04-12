import { useState, useMemo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNotifications } from "@/shared/lib/notifications"
import { useUpdateOrder } from "@/entities/order/model/hooks"
import { useClientCredits } from "@/features/transactions/model/hooks"
import { getPaidAmount } from "@/entities/order/model/model"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { DecimalTextField } from "@/shared/ui/DecimalTextField"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Lock } from "lucide-react"
import { logAction } from "@/shared/lib/auditService"
import { useAuth } from "@/shared/auth"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

interface ExchangeEditModalProps {
    order: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (updatedOrder: any) => void
    bankAccounts: any[]
}

export function ExchangeEditModal({ order, open, onOpenChange, onSuccess, bankAccounts }: ExchangeEditModalProps) {
    const { notifySuccess, notifyError, notifyLoading, dismiss } = useNotifications()
    const updateOrder = useUpdateOrder()
    const queryClient = useQueryClient()
    const { user } = useAuth()

    // Determine if this order already has a deposit recorded
    // Prefer the explicit .deposit property if available (source of truth from parent)
    const originalDeposit = Number(order.deposit ?? getPaidAmount(order) ?? 0)
    const hasExistingDeposit = originalDeposit > 0

    // The original payment method — locked if there's an existing deposit
    const originalMethod = order.paymentMethod || 'EFECTIVO'
    const originalBankAccountId = order.bankAccountId || ''

    const [formData, setFormData] = useState({
        total: Number(order.total) || 0,
        deposit: originalDeposit,
        possibleDeliveryDate: order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : '',
        orderNumber: order.orderNumber || '',
        description: order.description || '', // New description
        sourceOrderNumber: order.sourceOrderNumber || '',
        sourceQuantity: order.sourceQuantity || 1,
        sourceDescription: order.sourceDescription || '',
        sourceBrandName: order.sourceBrandName || '',
        paymentMethod: originalMethod,
        bankAccountId: originalBankAccountId
    })

    useEffect(() => {
        if (order) {
            const dep = Number(order.deposit ?? getPaidAmount(order) ?? 0)
            setFormData({
                total: Number(order.total) || 0,
                deposit: dep,
                possibleDeliveryDate: order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : '',
                orderNumber: order.orderNumber || '',
                description: order.description || '',
                sourceOrderNumber: order.sourceOrderNumber || '',
                sourceQuantity: order.sourceQuantity || 1,
                sourceDescription: order.sourceDescription || '',
                sourceBrandName: order.sourceBrandName || '',
                paymentMethod: order.paymentMethod || 'EFECTIVO',
                bankAccountId: order.bankAccountId || ''
            })
        }
    }, [order, open])

    const { data: walletData } = useClientCredits(order.clientId || '')
    const walletBalance = walletData?.reduce((acc: number, curr: any) => {
        if (curr.status === 'AVAILABLE') return acc + Number(curr.remainingAmount || 0)
        return acc
    }, 0) || 0

    const filteredBankAccounts = useMemo(() => {
        if (formData.paymentMethod === 'EFECTIVO') {
            return bankAccounts.filter(acc => acc.type === 'CASH')
        }
        return []
    }, [bankAccounts, formData.paymentMethod])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 1. Validations
        if (hasExistingDeposit) {
            if (formData.deposit < 0) return notifyError(null, 'El abono no puede ser negativo.')
        } else {
            if (formData.paymentMethod === 'BILLETERA_VIRTUAL' && formData.deposit > walletBalance) {
                return notifyError(null, `Saldo insuficiente. Disponible: $${walletBalance.toFixed(2)}`)
            }
            if (formData.paymentMethod === 'EFECTIVO' && formData.deposit > 0 && !formData.bankAccountId) {
                return notifyError(null, 'Seleccione una cuenta bancaria.')
            }
        }

        try {
            const quantity = Number(order.items?.[0]?.quantity || 1)
            const unitPrice = quantity > 0 ? formData.total / quantity : 0

            const payload = {
                total: formData.total,
                possibleDeliveryDate: formData.possibleDeliveryDate,
                orderNumber: formData.orderNumber,
                description: formData.description,
                sourceOrderNumber: formData.sourceOrderNumber,
                sourceQuantity: formData.sourceQuantity,
                sourceDescription: formData.sourceDescription,
                sourceBrandName: formData.sourceBrandName,
                items: [{
                    id: order.items?.[0]?.id || crypto.randomUUID(),
                    productName: order.brandName || "Cambio",
                    quantity: quantity,
                    unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                    brandId: order.brandId,
                    brandName: order.brandName || "Marca"
                }],
                deposit: formData.deposit,
                paymentMethod: hasExistingDeposit ? originalMethod : formData.paymentMethod,
                bankAccountId: hasExistingDeposit ? originalBankAccountId : formData.bankAccountId
            }

            // ONLY call the API if this is a PERSISTED order (has a numeric-looking ID or we are in a context where orders exist)
            // In this app, temporary IDs are often UUIDs from crypto.randomUUID()
            // Real IDs from the backend are often also UUIDs, but we can check if it's a "draft" context.
            // A simple way to check if it's a draft is if it lacks a 'status' or if it's explicitly marked.
            // In NewExchangePage, items have 'id: crypto.randomUUID()' but no status until saved.
            
            const isPersisted = !!(order.status || order.createdAt);

            if (isPersisted) {
                notifyLoading('Actualizando datos del cambio...')
                await updateOrder.mutateAsync({ id: order.id, data: payload })
                queryClient.invalidateQueries({ queryKey: ['orders'] })
                queryClient.invalidateQueries({ queryKey: ['receiptOrders', order.receiptNumber] })
                dismiss()

                if (user) {
                    logAction({
                        userId: user.id,
                        userName: user.username,
                        action: 'UPDATE_EXCHANGE',
                        module: 'exchanges',
                        detail: `Actualizó datos del cambio ${order.receiptNumber}. Total: $${formData.total}. Abono: $${formData.deposit}`,
                        severity: 'INFO',
                        success: true
                    })
                }

                notifySuccess('Cambio actualizado correctamente.')
            } else {
                notifySuccess('Ítem actualizado localmente.')
            }
            
            onSuccess({
                ...order,
                ...payload
            })
            onOpenChange(false)
        } catch (error: any) {
            dismiss()
            notifyError(error, 'Error al actualizar.')
        }
    }

    const saldo = formData.total - formData.deposit

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full rounded-3xl p-0 gap-0 overflow-hidden bg-white">
                <div className="bg-monchito-purple/5 p-6 border-b border-monchito-purple/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-monchito-purple uppercase tracking-tight">Editar Item de Cambio</DialogTitle>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {/* SECTION 1: DETALLES BASICOS */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Información General</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600">Catálogo</Label>
                                    <div className="h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center font-bold text-slate-500 uppercase text-xs">
                                        {order.brandName || "---"}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600">N° Cambio (Consecutivo)</Label>
                                    <Input 
                                        value={formData.orderNumber} 
                                        disabled
                                        className="h-11 bg-slate-50 text-xs font-mono border-slate-100 rounded-xl" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600">N° Cambio (Manual / Guía)</Label>
                                    <Input 
                                        value={formData.sourceOrderNumber} 
                                        onChange={(e) => setFormData({ ...formData, sourceOrderNumber: e.target.value.toUpperCase() })} 
                                        className="h-11 text-xs font-mono border-slate-200 rounded-xl focus:ring-monchito-purple/20" 
                                        placeholder="Ingrese N°..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: VALORES Y FECHAS */}
                        <div className="space-y-4">
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Finanzas y Logística</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600">Valor del Cambio ($)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <DecimalTextField
                                            value={Number(formData.total) || 0}
                                            onValueChange={(n) => setFormData({ ...formData, total: n })}
                                            className="h-11 pl-8 text-xs font-black text-slate-800 border-slate-200 rounded-xl focus-visible:ring-monchito-purple/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600">Abono Inicial ($)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">$</span>
                                        <DecimalTextField
                                            value={Number(formData.deposit) || 0}
                                            onValueChange={(n) => setFormData({ ...formData, deposit: n })}
                                            className="h-11 pl-8 text-xs font-black text-emerald-700 border-slate-200 bg-emerald-50/20 rounded-xl focus-visible:ring-emerald-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600">Fecha de Entrega</Label>
                                    <Input 
                                        type="date" 
                                        value={formData.possibleDeliveryDate} 
                                        onChange={(e) => setFormData({ ...formData, possibleDeliveryDate: e.target.value })} 
                                        className="h-11 text-xs border-slate-200 rounded-xl focus:ring-monchito-purple/20" 
                                    />
                                </div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Saldo Pendiente:</span>
                                <span className={`font-black text-lg ${saldo > 0 ? 'text-red-500' : 'text-slate-900'}`}>{formatCurrency(saldo)}</span>
                             </div>
                        </div>

                        {/* SECTION 3: DESCRIPCIONES */}
                        <div className="space-y-4">
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Descripciones del Cambio</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600">LO QUE ENTREGA (CANT: {formData.sourceQuantity})</Label>
                                    <textarea 
                                        value={formData.sourceDescription} 
                                        onChange={(e) => setFormData({ ...formData, sourceDescription: e.target.value })} 
                                        className="w-full h-20 p-4 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-monchito-purple/10 outline-none resize-none"
                                        placeholder="Describa la prenda que se va..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600">LO QUE RECIBE</Label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                        className="w-full h-20 p-4 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-monchito-purple/10 outline-none resize-none text-monchito-purple font-medium"
                                        placeholder="Describa la prenda que viene..."
                                    />
                                </div>
                             </div>
                        </div>

                        {/* SECTION 4: PAGO */}
                        <div className="space-y-4 pt-2">
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Información de Pago</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                                        Método de Pago {hasExistingDeposit && <Lock className="h-3 w-3" />}
                                    </Label>
                                    <select 
                                        disabled={hasExistingDeposit} 
                                        className="w-full h-11 rounded-xl border border-slate-200 text-xs px-4 shadow-sm appearance-none focus:ring-2 focus:ring-monchito-purple/20 transition-all disabled:bg-slate-50 font-medium" 
                                        value={formData.paymentMethod} 
                                        onChange={e => setFormData({...formData, paymentMethod: e.target.value, bankAccountId: e.target.value === 'EFECTIVO' ? (bankAccounts.find(a => a.type === 'CASH')?.id || '') : ''})}
                                    >
                                        <option value="EFECTIVO">EFECTIVO (CASH)</option>
                                        <option value="BILLETERA_VIRTUAL">BILLETERA VIRTUAL</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                                        Cuenta Bancaria {hasExistingDeposit && <Lock className="h-3 w-3" />}
                                    </Label>
                                    <select 
                                        disabled={hasExistingDeposit || formData.paymentMethod === 'BILLETERA_VIRTUAL'} 
                                        className="w-full h-11 rounded-xl border border-slate-200 text-xs px-4 shadow-sm appearance-none focus:ring-2 focus:ring-monchito-purple/20 transition-all disabled:bg-slate-50 font-medium" 
                                        value={formData.bankAccountId} 
                                        onChange={e => setFormData({...formData, bankAccountId: e.target.value})}
                                    >
                                        <option value="">Seleccione cuenta...</option>
                                        {filteredBankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                             </div>
                             {formData.paymentMethod === 'BILLETERA_VIRTUAL' && (
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-[10px] font-bold text-blue-700">
                                    * El abono se descontará del saldo disponible en la billetera virtual de la empresaria.
                                </div>
                             )}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-8 h-12 font-bold text-slate-500 hover:bg-slate-200 flex-1 sm:flex-none">Cancelar</Button>
                        <AsyncButton type="submit" isLoading={updateOrder.isPending} className="bg-monchito-purple hover:bg-monchito-purple/90 text-white rounded-xl px-12 h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-monchito-purple/20 transition-all active:scale-95 flex-1">
                            Guardar Cambios del Item
                        </AsyncButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
