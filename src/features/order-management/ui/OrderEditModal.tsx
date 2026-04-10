import { useState, useMemo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNotifications } from "@/shared/lib/notifications"
import { useUpdateOrder } from "@/entities/order/model/hooks"
import { useClientCredits } from "@/features/transactions/model/hooks"
import { getPaidAmount } from "@/entities/order/model/model"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Separator } from "@/shared/ui/separator"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Lock } from "lucide-react"

interface OrderEditModalProps {
    order: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (updatedOrder: any) => void
    lastClosureDate: Date | null
    bankAccounts: any[]
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export function OrderEditModal({ order, open, onOpenChange, onSuccess, lastClosureDate, bankAccounts }: OrderEditModalProps) {
    const { notifySuccess, notifyError, notifyLoading, dismiss } = useNotifications()
    const updateOrder = useUpdateOrder()
    const queryClient = useQueryClient()

    // Determine if this order already has a deposit recorded
    const originalDeposit = Number(order.deposit ?? getPaidAmount(order) ?? 0)
    const hasExistingDeposit = originalDeposit > 0

    // The original payment method — locked if there's an existing deposit
    const originalMethod = order.paymentMethod || 'EFECTIVO'
    const originalBankAccountId = order.bankAccountId || ''

    const formatDateForInput = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        total: Number(order.total) || 0,
        deposit: originalDeposit,
        possibleDeliveryDate: formatDateForInput(order.possibleDeliveryDate),
        orderNumber: order.orderNumber || '',
        paymentMethod: originalMethod,
        bankAccountId: originalBankAccountId
    })

    useEffect(() => {
        if (open && order) {
            const dep = Number(order.deposit ?? getPaidAmount(order) ?? 0)
            const method = order.paymentMethod || 'EFECTIVO'
            setFormData({
                total: Number(order.total) || 0,
                deposit: dep,
                possibleDeliveryDate: formatDateForInput(order.possibleDeliveryDate),
                orderNumber: order.orderNumber || '',
                paymentMethod: method,
                bankAccountId: order.bankAccountId || ''
            })
        }
    }, [open, order])

    const { data: walletData } = useClientCredits(order.clientId || '')
    // Use remainingAmount of AVAILABLE credits only — never the total generated
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

        // 1. Verificar cierre de caja antes de enviar
        if (lastClosureDate && order.transactionDate) {
            const transactionDate = new Date(order.transactionDate)
            if (transactionDate <= lastClosureDate) {
                notifyError(null, 'No se puede guardar: El periodo de caja para esta fecha ya está cerrado.')
                return
            }
        }
        
        // 2. Verificar estado del pedido y movimientos
        const BLOCKED_STATUSES = ['RECIBIDO_EN_BODEGA', 'ENTREGADO', 'CAMBIADO'];
        const payments = order.payments || [];
        const hasExtraPayments = payments.length > 2 || (payments.length > 1 && !payments.some((p: any) => p.method === 'CREDITO_CLIENTE'));

        if (BLOCKED_STATUSES.includes(order.status) || hasExtraPayments) {
            let reason = 'No se puede editar: El pedido ya tiene movimientos procesados.'
            if (order.status === 'RECIBIDO_EN_BODEGA') reason = 'No se puede editar: El pedido ya ha sido receptado en bodega.'
            if (order.status === 'ENTREGADO') reason = 'No se puede editar: El pedido ya ha sido entregado.'
            if (BLOCKED_STATUSES.includes(order.status)) reason = `No se puede editar: El pedido ya está en estado ${order.status}.`
            if (hasExtraPayments) reason = 'No se puede editar: El pedido ya tiene abonos adicionales registrados desde el módulo de abonos.'
            notifyError(null, reason)
            return
        }

        // 3. Business rules for locked method
        if (hasExistingDeposit) {
            // Only allow reducing or keeping the same deposit — not increasing beyond original for safety
            if (formData.deposit < 0) {
                notifyError(null, 'El abono no puede ser negativo.')
                return
            }
            if (formData.deposit > formData.total) {
                notifyError(null, 'El abono no puede ser mayor al valor del pedido.')
                return
            }
        } else {
            // New deposit: validate wallet balance if using BILLETERA_VIRTUAL
            if (formData.paymentMethod === 'BILLETERA_VIRTUAL' && formData.deposit > walletBalance) {
                notifyError(null, `Saldo insuficiente en billetera. Disponible: $${walletBalance.toFixed(2)}, Requerido: $${formData.deposit.toFixed(2)}`)
                return
            }
            if (formData.paymentMethod === 'EFECTIVO' && !formData.bankAccountId) {
                notifyError(null, 'Seleccione una cuenta bancaria para el abono.')
                return
            }
        }

        try {
            notifyLoading('Actualizando datos del pedido...')
            const productName = order.brand?.name || order.brandName || "Producto"
            const quantity = Number(order.items?.[0]?.quantity || 1)
            const unitPrice = quantity > 0 ? formData.total / quantity : 0

            const payload = {
                total: formData.total,
                possibleDeliveryDate: formData.possibleDeliveryDate,
                orderNumber: formData.orderNumber,
                items: [{
                    id: order.items?.[0]?.id || crypto.randomUUID(),
                    productName: productName,
                    quantity: quantity,
                    unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                    brandId: order.brandId,
                    brandName: order.brand?.name || order.brandName || "Marca"
                }],
                deposit: formData.deposit,
                // If locked, always send the original method — backend uses this to know which account to adjust
                paymentMethod: hasExistingDeposit ? originalMethod : formData.paymentMethod,
                bankAccountId: hasExistingDeposit ? originalBankAccountId : formData.bankAccountId
            }

            await updateOrder.mutateAsync({ id: order.id, data: payload })
            
            queryClient.invalidateQueries({ queryKey: ['orders', 'receipt', order.receiptNumber] })
            queryClient.invalidateQueries({ queryKey: ['client-credits', order.clientId] })
            
            dismiss()
            notifySuccess('Pedido actualizado correctamente.')
            onSuccess({
                ...order,
                ...payload,
                total: payload.total,
                possibleDeliveryDate: payload.possibleDeliveryDate,
                orderNumber: payload.orderNumber,
                payments: order.payments,
            })
            onOpenChange(false)
        } catch (error: any) {
            dismiss()
            console.error('Error updating order:', error)
            notifyError(error, 'Error al actualizar el pedido.')
        }
    }

    const saldo = formData.total - formData.deposit

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full rounded-3xl p-0 gap-0 overflow-hidden bg-white shadow-2xl border-none">
                <div className="bg-slate-900 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Editar Pedido de Venta</DialogTitle>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                         {/* INFO SECTION */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Catálogo</Label>
                                <div className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center font-black text-slate-600 uppercase text-xs">
                                    {order.brand?.name || order.brandName || "---"}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Número de Pedido</Label>
                                <Input
                                    value={formData.orderNumber}
                                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                    placeholder="N° de guía o manual"
                                    className="h-11 text-sm font-mono border-slate-200 rounded-xl focus:ring-monchito-purple/20"
                                />
                            </div>
                         </div>

                         {/* FINANCE SECTION */}
                         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Valor Total del Pedido</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-11 pl-8 text-sm font-black text-slate-900 border-slate-200 rounded-xl focus:ring-monchito-purple/20"
                                            value={formData.total}
                                            onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Abono Registrado</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">$</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={formData.total}
                                            className="h-11 pl-8 text-sm font-black text-emerald-700 border-slate-200 bg-white rounded-xl focus:ring-emerald-500/20"
                                            value={formData.deposit}
                                            onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <Separator className="bg-slate-200" />
                            
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente:</span>
                                <span className={`text-xl font-black ${saldo > 0 ? 'text-red-500' : 'text-slate-900'}`}>{formatCurrency(saldo)}</span>
                            </div>
                         </div>

                         {/* LOGISTICS SECTION */}
                         <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Fecha de Entrega Estimada</Label>
                            <Input
                                type="date"
                                value={formData.possibleDeliveryDate}
                                onChange={(e) => setFormData({ ...formData, possibleDeliveryDate: e.target.value })}
                                required
                                className="h-11 text-sm border-slate-200 rounded-xl focus:ring-monchito-purple/20"
                            />
                         </div>

                         {/* PAYMENT METHOD SECTION */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                             <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                    Método de Pago {hasExistingDeposit && <Lock className="h-3 w-3" />}
                                </Label>
                                {hasExistingDeposit ? (
                                    <div className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-400">
                                        <span>{originalMethod === 'BILLETERA_VIRTUAL' ? 'BILLETERA VIRTUAL' : originalMethod}</span>
                                        <Lock className="h-3 w-3" />
                                    </div>
                                ) : (
                                    <select
                                        className="w-full h-11 rounded-xl border border-slate-200 text-sm px-4 focus:ring-2 focus:ring-monchito-purple/10 outline-none appearance-none bg-white font-medium"
                                        value={formData.paymentMethod}
                                        onChange={(e) => {
                                            const method = e.target.value
                                            setFormData({ 
                                                ...formData, 
                                                paymentMethod: method,
                                                bankAccountId: method === 'EFECTIVO' 
                                                    ? (bankAccounts.find((a: any) => a.type === 'CASH')?.id || '') 
                                                    : ''
                                            })
                                        }}
                                    >
                                        <option value="EFECTIVO">EFECTIVO</option>
                                        <option value="BILLETERA_VIRTUAL">BILLETERA VIRTUAL</option>
                                    </select>
                                )}
                                {hasExistingDeposit && (
                                    <p className="text-[9px] text-slate-400 pl-1">Bloqueado por abono registrado.</p>
                                )}
                             </div>

                             <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Cuenta Bancaria</Label>
                                {hasExistingDeposit || formData.paymentMethod === 'BILLETERA_VIRTUAL' ? (
                                    <div className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300">
                                        <span>{originalMethod === 'BILLETERA_VIRTUAL' ? 'No aplica (Billetera)' : (bankAccounts.find(a => a.id === originalBankAccountId)?.name || 'Efectivo')}</span>
                                        <Lock className="h-3 w-3" />
                                    </div>
                                ) : (
                                    <select
                                        className="w-full h-11 rounded-xl border border-slate-200 text-sm px-4 focus:ring-2 focus:ring-monchito-purple/10 outline-none appearance-none bg-white font-medium"
                                        value={formData.bankAccountId}
                                        onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                    >
                                        <option value="">Seleccione cuenta...</option>
                                        {filteredBankAccounts.map((acc: any) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                             </div>
                         </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={updateOrder.isPending}
                            className="h-12 font-bold text-slate-500 rounded-xl px-8 flex-1 sm:flex-none"
                        >
                            Cancelar
                        </Button>
                        <AsyncButton
                            type="submit"
                            isLoading={updateOrder.isPending}
                            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs px-12 shadow-lg shadow-monchito-purple/20 transition-all active:scale-95 flex-1"
                        >
                            Guardar Cambios del Pedido
                        </AsyncButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
