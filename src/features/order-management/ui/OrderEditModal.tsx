import { useState, useMemo } from "react"
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

export function OrderEditModal({ order, open, onOpenChange, onSuccess, lastClosureDate, bankAccounts }: OrderEditModalProps) {
    const { notifySuccess, notifyError, notifyLoading, dismiss } = useNotifications()
    const updateOrder = useUpdateOrder()
    const queryClient = useQueryClient()

    // Determine if this order already has a deposit recorded
    const originalDeposit = getPaidAmount(order) || 0
    const hasExistingDeposit = originalDeposit > 0

    // The original payment method — locked if there's an existing deposit
    const originalMethod = order.paymentMethod || 'EFECTIVO'
    const originalBankAccountId = order.bankAccountId || ''

    const [formData, setFormData] = useState({
        total: Number(order.total) || 0,
        deposit: originalDeposit,
        possibleDeliveryDate: order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : '',
        orderNumber: order.orderNumber || '',
        // If locked, always use the original. If new, default to EFECTIVO.
        paymentMethod: originalMethod,
        bankAccountId: originalBankAccountId
    })

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
        if (order.status !== 'POR_RECIBIR' || (order.payments && order.payments.length > 1)) {
            let reason = 'No se puede editar: El pedido ya tiene movimientos procesados.'
            if (order.status === 'RECIBIDO_EN_BODEGA') reason = 'No se puede editar: El pedido ya ha sido receptado en bodega.'
            if (order.status === 'ENTREGADO') reason = 'No se puede editar: El pedido ya ha sido entregado.'
            if (order.payments && order.payments.length > 1) reason = 'No se puede editar: El pedido ya tiene abonos adicionales vinculados.'
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
        } catch (error: any) {
            dismiss()
            console.error('Error updating order:', error)
            notifyError(error, 'Error al actualizar el pedido.')
        }
    }

    const saldo = formData.total - formData.deposit

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-800">Editar Pedido</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100 text-slate-600 border-b uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-3 py-2 border-r text-left">Catálogo</th>
                                    <th className="px-3 py-2 border-r text-left">N° Pedido</th>
                                    <th className="px-3 py-2 border-r text-right">Valor Pedido</th>
                                    <th className="px-3 py-2 border-r text-right">Abono</th>
                                    <th className="px-3 py-2 border-r text-right">Saldo</th>
                                    <th className="px-3 py-2 text-left">Posible Entrega</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-indigo-50/20 transition-colors">
                                    <td className="px-3 py-2 border-r">
                                        <Input
                                            value={order.brand?.name || order.brandName}
                                            disabled
                                            className="h-8 text-xs bg-slate-50 border-none"
                                        />
                                    </td>
                                    <td className="px-3 py-2 border-r">
                                        <Input
                                            value={formData.orderNumber}
                                            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                            placeholder="Ej: 12345"
                                            className="h-8 text-xs font-mono"
                                        />
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <span className="text-slate-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="h-7 w-20 text-right font-bold border-none focus:ring-0 outline-none text-xs bg-transparent hide-spinner"
                                                value={formData.total}
                                                onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <span className="text-green-600 text-xs">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={formData.total}
                                                className="h-7 w-20 text-right text-green-600 font-bold rounded border-green-100 focus:ring-1 focus:ring-green-500 outline-none text-xs bg-green-50/30 hide-spinner"
                                                value={formData.deposit}
                                                onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <span className={`font-bold text-xs ${saldo > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                            ${saldo.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="date"
                                            value={formData.possibleDeliveryDate}
                                            onChange={(e) => setFormData({ ...formData, possibleDeliveryDate: e.target.value })}
                                            required
                                            className="h-8 text-xs pr-8"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                Método de Pago:
                                {hasExistingDeposit && <Lock className="h-3 w-3 text-slate-400" />}
                                {formData.paymentMethod === 'BILLETERA_VIRTUAL' && !hasExistingDeposit && (
                                    <span className="ml-1 text-emerald-600 font-medium">(Saldo: ${walletBalance.toFixed(2)})</span>
                                )}
                            </Label>
                            {hasExistingDeposit ? (
                                // LOCKED: show as badge, cannot change
                                <div className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 text-xs px-3 flex items-center gap-2 text-slate-500 cursor-not-allowed">
                                    <Lock className="h-3 w-3 text-slate-400" />
                                    <span className="font-medium">{originalMethod === 'BILLETERA_VIRTUAL' ? 'BILLETERA VIRTUAL' : originalMethod}</span>
                                    {originalMethod === 'BILLETERA_VIRTUAL' && (
                                        <span className="ml-auto text-emerald-600 font-bold">Saldo: ${walletBalance.toFixed(2)}</span>
                                    )}
                                </div>
                            ) : (
                                // UNLOCKED: user can choose
                                <select
                                    className="w-full h-9 rounded-md border border-slate-200 text-xs px-3 focus:ring-1 focus:ring-monchito-purple outline-none"
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
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Para cambiar el método de pago, elimine este pedido y cree uno nuevo.
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                Cuenta Bancaria:
                                {hasExistingDeposit && <Lock className="h-3 w-3 text-slate-400" />}
                            </Label>
                            {hasExistingDeposit || formData.paymentMethod === 'BILLETERA_VIRTUAL' ? (
                                <div className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 text-xs px-3 flex items-center gap-2 text-slate-400 cursor-not-allowed">
                                    <Lock className="h-3 w-3 text-slate-400" />
                                    <span>
                                        {originalMethod === 'BILLETERA_VIRTUAL' 
                                            ? 'No aplica (Billetera Virtual)' 
                                            : bankAccounts.find(a => a.id === originalBankAccountId)?.name || 'Cuenta original'}
                                    </span>
                                </div>
                            ) : (
                                <select
                                    className="w-full h-9 rounded-md border border-slate-200 text-xs px-3 focus:ring-1 focus:ring-monchito-purple outline-none"
                                    value={formData.bankAccountId}
                                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                >
                                    <option value="">Seleccione una cuenta...</option>
                                    {filteredBankAccounts.map((acc: any) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.bankName || (acc.type === 'CASH' ? 'Efectivo' : 'Banco')})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateOrder.isPending}
                            className="h-8 text-xs"
                        >
                            Cancelar
                        </Button>
                        <AsyncButton
                            type="submit"
                            isLoading={updateOrder.isPending}
                            className="bg-slate-800 h-8 text-xs"
                        >
                            Guardar Cambios
                        </AsyncButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
