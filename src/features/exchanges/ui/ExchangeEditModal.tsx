import { useState, useMemo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNotifications } from "@/shared/lib/notifications"
import { useUpdateOrder } from "@/entities/order/model/hooks"
import { useClientCredits } from "@/features/transactions/model/hooks"
import { getPaidAmount } from "@/entities/order/model/model"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Lock } from "lucide-react"

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
            if (formData.deposit > formData.total) return notifyError(null, 'El abono no puede ser mayor al valor.')
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
            <DialogContent className="max-w-6xl rounded-3xl overflow-hidden p-6 gap-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Editar Cambio</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Horizontal scroll container for the table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm custom-scrollbar">
                        <table className="w-full text-[11px] border-collapse min-w-[1100px]">
                            <thead className="bg-slate-50 text-slate-500 border-b uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-3 py-3 border-r text-left">Catálogo</th>
                                    <th className="px-3 py-3 border-r text-left w-[180px]">N° Cambio</th>
                                    <th className="px-3 py-3 border-r text-right w-[110px]">Valor</th>
                                    <th className="px-3 py-3 border-r text-right w-[110px]">Abono</th>
                                    <th className="px-3 py-3 border-r text-right w-[90px]">Saldo</th>

                                    <th className="px-3 py-3 border-r text-center w-[60px]">Cant.</th>
                                    <th className="px-3 py-3 border-r text-left">Descrip. Origen</th>
                                    <th className="px-3 py-3 border-r text-left">Descrip. Destino</th>
                                    <th className="px-3 py-3 text-center w-[140px]">Posible Entrega</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 py-4 border-r font-bold text-slate-600 uppercase">{order.brandName || "---"}</td>
                                    <td className="px-3 py-4 border-r">
                                        <Input 
                                            value={formData.sourceOrderNumber} 
                                            onChange={(e) => setFormData({ ...formData, sourceOrderNumber: e.target.value })} 
                                            className="h-9 text-[11px] font-mono border-slate-200" 
                                            placeholder="N° Manual"
                                        />
                                    </td>
                                    <td className="px-3 py-4 border-r text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <span className="text-slate-400">$</span>
                                            <input 
                                                type="number" 
                                                className="h-8 w-20 text-right font-black border-none outline-none bg-transparent" 
                                                value={formData.total} 
                                                onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })} 
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 border-r text-right bg-emerald-50/10">
                                        <div className="flex justify-end items-center gap-1">
                                            <span className="text-emerald-600">$</span>
                                            <input 
                                                type="number" 
                                                className="h-8 w-20 text-right text-emerald-600 font-black border-none outline-none bg-transparent" 
                                                value={formData.deposit} 
                                                onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })} 
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 border-r text-right">
                                        <span className={`font-black ${saldo > 0 ? 'text-red-500' : 'text-slate-400'}`}>${saldo.toFixed(2)}</span>
                                    </td>

                                    <td className="px-3 py-4 border-r text-center text-slate-500 font-black">{formData.sourceQuantity}</td>
                                    <td className="px-3 py-4 border-r text-slate-400 italic truncate max-w-[120px]" title={formData.sourceDescription}>{formData.sourceDescription || "---"}</td>
                                    <td className="px-3 py-4 border-r text-slate-400 italic truncate max-w-[120px]" title={formData.description}>{formData.description || "---"}</td>
                                    <td className="px-3 py-4">
                                        <Input 
                                            type="date" 
                                            value={formData.possibleDeliveryDate} 
                                            onChange={(e) => setFormData({ ...formData, possibleDeliveryDate: e.target.value })} 
                                            className="h-9 text-[11px] border-slate-200" 
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex-1 space-y-2">
                             <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                Método de Pago {hasExistingDeposit && <Lock className="h-3 w-3" />}
                             </Label>
                             <select 
                                disabled={hasExistingDeposit} 
                                className="w-full h-11 rounded-xl border border-slate-200 text-xs px-4 shadow-sm appearance-none focus:ring-2 focus:ring-slate-900 transition-all disabled:bg-slate-50" 
                                value={formData.paymentMethod} 
                                onChange={e => setFormData({...formData, paymentMethod: e.target.value, bankAccountId: e.target.value === 'EFECTIVO' ? (bankAccounts.find(a => a.type === 'CASH')?.id || '') : ''})}
                            >
                                <option value="EFECTIVO">EFECTIVO (CASH)</option>
                                <option value="BILLETERA_VIRTUAL">BILLETERA VIRTUAL</option>
                            </select>
                        </div>

                        <div className="flex-1 space-y-2">
                             <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                Cuenta Bancaria {hasExistingDeposit && <Lock className="h-3 w-3" />}
                             </Label>
                             <select 
                                disabled={hasExistingDeposit || formData.paymentMethod === 'BILLETERA_VIRTUAL'} 
                                className="w-full h-11 rounded-xl border border-slate-200 text-xs px-4 shadow-sm appearance-none focus:ring-2 focus:ring-slate-900 transition-all disabled:bg-slate-50" 
                                value={formData.bankAccountId} 
                                onChange={e => setFormData({...formData, bankAccountId: e.target.value})}
                            >
                                <option value="">Seleccione cuenta...</option>
                                {filteredBankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>

                        <div className="flex items-end gap-2 pt-2 md:pt-0">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6 h-11 font-bold text-slate-500">Cancelar</Button>
                            <AsyncButton type="submit" isLoading={updateOrder.isPending} className="bg-slate-900 hover:bg-black text-white rounded-xl px-12 h-11 font-black uppercase tracking-widest text-xs">Guardar Cambios</AsyncButton>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
