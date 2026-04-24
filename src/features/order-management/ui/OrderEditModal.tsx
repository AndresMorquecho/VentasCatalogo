import { useState, useMemo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNotifications } from "@/shared/lib/notifications"
import { useUpdateOrder } from "@/entities/order/model/hooks"
import { useClientCredits } from "@/features/transactions/model/hooks"
import { useAuth } from "@/shared/auth"
import { getPaidAmount } from "@/entities/order/model/model"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { DecimalTextField } from "@/shared/ui/DecimalTextField"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Lock, AlertTriangle, DollarSign } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"

interface OrderEditModalProps {
    order: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (updatedOrder: any) => void
    lastClosureDate: Date | null
    bankAccounts: any[]
}

const fmt = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(amount)

export function OrderEditModal({ order, open, onOpenChange, onSuccess, lastClosureDate, bankAccounts }: OrderEditModalProps) {
    const { notifySuccess, notifyError, notifyLoading, dismiss } = useNotifications()
    const updateOrder = useUpdateOrder()
    const queryClient = useQueryClient()
    const { hasPermission } = useAuth()

    // ── Permission checks ────────────────────────────────────────
    const canEditPrice = hasPermission('orders.edit_price' as any)

    // Does this order have extra payments that block regular editing?
    const payments = order.payments || []
    const VALID_INITIAL_METHODS = ['CREDITO_CLIENTE', 'BILLETERA_VIRTUAL', 'SALDO_A_FAVOR']
    const hasExtraPayments = payments.length > 2 || (payments.length > 1 && !payments.some((p: any) => VALID_INITIAL_METHODS.includes(p.method)))
    const BLOCKED_STATUSES = ['RECIBIDO_EN_BODEGA', 'ENTREGADO', 'CAMBIADO']
    const isStatusBlocked = BLOCKED_STATUSES.includes(order.status)

    // "Price-only mode" = has extra payments but user can still correct price
    // When true, the regular form fields are shown locked/dimmed as read-only info
    const isPriceOnlyMode = hasExtraPayments && canEditPrice && !isStatusBlocked

    // Is price correction itself blocked?
    const isPriceEditBlocked = ['ENTREGADO', 'CAMBIADO', 'ANULADO', 'DESMANTELADO'].includes(order.status)

    // ── Form state ───────────────────────────────────────────────
    const originalDeposit = Number(order.deposit ?? getPaidAmount(order) ?? 0)
    const hasExistingDeposit = originalDeposit > 0
    const originalMethod = order.paymentMethod || 'EFECTIVO'
    const originalBankAccountId = order.bankAccountId || ''

    const formatDateForInput = (date: any) => {
        if (!date) return ''
        const d = new Date(date)
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
    }

    const [formData, setFormData] = useState({
        total: Number(order.total) || 0,
        deposit: originalDeposit,
        possibleDeliveryDate: formatDateForInput(order.possibleDeliveryDate),
        orderNumber: order.orderNumber || '',
        paymentMethod: originalMethod,
        bankAccountId: originalBankAccountId
    })
    const [priceValue, setPriceValue] = useState(Number(order.total) || 0)
    const [isSavingPrice, setIsSavingPrice] = useState(false)

    useEffect(() => {
        if (open && order) {
            const dep = Number(order.deposit ?? getPaidAmount(order) ?? 0)
            setFormData({
                total: Number(order.total) || 0,
                deposit: dep,
                possibleDeliveryDate: formatDateForInput(order.possibleDeliveryDate),
                orderNumber: order.orderNumber || '',
                paymentMethod: order.paymentMethod || 'EFECTIVO',
                bankAccountId: order.bankAccountId || ''
            })
            setPriceValue(Number(order.total) || 0)
        }
    }, [open, order])

    const { data: walletData } = useClientCredits(order.clientId || '')
    const walletBalance = walletData?.reduce((acc: number, curr: any) => {
        if (curr.status === 'AVAILABLE') return acc + Number(curr.remainingAmount || 0)
        return acc
    }, 0) || 0

    const filteredBankAccounts = useMemo(() => {
        if (formData.paymentMethod === 'EFECTIVO') return bankAccounts.filter(acc => acc.type === 'CASH')
        return []
    }, [bankAccounts, formData.paymentMethod])

    // ── Regular edit submit ──────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (lastClosureDate && order.transactionDate) {
            if (new Date(order.transactionDate) <= lastClosureDate) {
                notifyError(null, 'No se puede guardar: El periodo de caja ya está cerrado.')
                return
            }
        }
        if (isStatusBlocked || hasExtraPayments) {
            const reason = isStatusBlocked
                ? `No se puede editar: El pedido ya está en estado ${order.status}.`
                : 'No se puede editar: El pedido ya tiene abonos adicionales.'
            notifyError(null, reason)
            return
        }
        if (hasExistingDeposit && formData.deposit < 0) {
            notifyError(null, 'El abono no puede ser negativo.')
            return
        }
        if (!hasExistingDeposit) {
            if (formData.paymentMethod === 'BILLETERA_VIRTUAL' && formData.deposit > walletBalance) {
                notifyError(null, `Saldo insuficiente en billetera. Disponible: $${walletBalance.toFixed(2)}`)
                return
            }
            if (formData.paymentMethod === 'EFECTIVO' && !formData.bankAccountId) {
                notifyError(null, 'Seleccione una cuenta bancaria.')
                return
            }
        }
        try {
            notifyLoading('Actualizando datos del pedido...')
            const quantity = Number(order.items?.[0]?.quantity || 1)
            const unitPrice = quantity > 0 ? formData.total / quantity : 0
            const payload = {
                total: formData.total,
                possibleDeliveryDate: formData.possibleDeliveryDate,
                orderNumber: formData.orderNumber,
                items: [{
                    id: order.items?.[0]?.id || crypto.randomUUID(),
                    productName: order.brand?.name || order.brandName || 'Producto',
                    quantity,
                    unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                    brandId: order.brandId,
                    brandName: order.brand?.name || order.brandName || 'Marca'
                }],
                deposit: formData.deposit,
                paymentMethod: hasExistingDeposit ? originalMethod : formData.paymentMethod,
                bankAccountId: hasExistingDeposit ? originalBankAccountId : formData.bankAccountId
            }
            await updateOrder.mutateAsync({ id: order.id, data: payload })
            queryClient.invalidateQueries({ queryKey: ['orders', 'receipt', order.receiptNumber] })
            queryClient.invalidateQueries({ queryKey: ['client-credits', order.clientId] })
            dismiss()
            notifySuccess('Pedido actualizado correctamente.')
            onSuccess({ ...order, ...payload, payments: order.payments })
            onOpenChange(false)
        } catch (error: any) {
            dismiss()
            notifyError(error, 'Error al actualizar el pedido.')
        }
    }

    // ── Price-only submit ────────────────────────────────────────
    const handlePriceUpdate = async () => {
        if (isPriceEditBlocked) {
            notifyError(null, `No se puede modificar el precio en estado ${order.status}.`)
            return
        }
        if (lastClosureDate && order.transactionDate) {
            if (new Date(order.transactionDate) <= lastClosureDate) {
                notifyError(null, 'No se puede modificar el precio: El periodo de caja ya está cerrado.')
                return
            }
        }
        if (Math.abs(priceValue - Number(order.total)) < 0.01) {
            notifyError(null, 'No hay cambios en el precio.')
            return
        }
        setIsSavingPrice(true)
        try {
            notifyLoading('Corrigiendo precio del pedido...')
            const result = await orderApi.updatePrice(order.id, priceValue)
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['receiptOrders', order.receiptNumber] })
            queryClient.invalidateQueries({ queryKey: ['payments'] })
            dismiss()
            notifySuccess(`Precio actualizado. Saldo pendiente: $${result?.priceEdit?.newSaldo?.toFixed(2) ?? '?'}`)
            onSuccess({ ...order, total: priceValue })
            onOpenChange(false)
        } catch (error: any) {
            dismiss()
            notifyError(error, 'Error al corregir el precio.')
        } finally {
            setIsSavingPrice(false)
        }
    }

    const saldo = formData.total - formData.deposit
    const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
    const newPriceSaldo = priceValue - totalPaid

    // ── PRICE-ONLY MODE render ────────────────────────────────────
    if (isPriceOnlyMode) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-sm w-[95vw] rounded-2xl p-0 gap-0 overflow-hidden bg-white shadow-2xl border-none">
                    {/* Header */}
                    <div className="bg-amber-500 p-4 sm:p-5 text-white flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-black uppercase tracking-tight text-white">
                                Corrección de Precio
                            </DialogTitle>
                            <p className="text-[10px] text-amber-100 mt-0.5">
                                {order.brand?.name || order.brandName} · {order.orderNumber || order.receiptNumber}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-4">
                        {/* Locked reason banner */}
                        <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <Lock className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                La edición completa está bloqueada porque este pedido tiene abonos adicionales. Solo puedes corregir el precio total.
                            </p>
                        </div>

                        {/* Resumen numérico */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Actual</p>
                                <p className="text-sm font-black text-slate-800">${Number(order.total).toFixed(2)}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ya Pagado</p>
                                <p className="text-sm font-black text-emerald-600">${totalPaid.toFixed(2)}</p>
                            </div>
                            <div className={`rounded-xl p-2.5 text-center border ${newPriceSaldo > 0.01 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nuevo Saldo</p>
                                <p className={`text-sm font-black ${newPriceSaldo > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    ${newPriceSaldo.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Input precio */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-amber-700 uppercase tracking-widest pl-1">
                                Nuevo Precio Total
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 font-bold">$</span>
                                <DecimalTextField
                                    className="h-11 pl-8 text-sm font-black text-amber-900 border-2 border-amber-300 rounded-xl focus-visible:ring-amber-400/30 bg-amber-50"
                                    value={priceValue}
                                    onValueChange={setPriceValue}
                                />
                            </div>
                        </div>

                        {newPriceSaldo > 0.01 && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <p className="text-[10px] text-amber-700">
                                    El pedido aparecerá con saldo pendiente de <strong>${newPriceSaldo.toFixed(2)}</strong> en el módulo de abonos.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-11 font-bold text-slate-500 rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handlePriceUpdate}
                            disabled={isSavingPrice}
                            className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl uppercase tracking-widest"
                        >
                            {isSavingPrice ? 'Guardando...' : 'Corregir Precio'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // ── FULL EDIT MODE render ────────────────────────────────────
    const statusColor: Record<string, string> = {
        POR_RECIBIR: 'bg-amber-100 text-amber-700',
        RECIBIDO_EN_BODEGA: 'bg-blue-100 text-blue-700',
        ENTREGADO: 'bg-emerald-100 text-emerald-700',
    }
    const statusLabel: Record<string, string> = {
        POR_RECIBIR: 'Por Recibir',
        RECIBIDO_EN_BODEGA: 'En Bodega',
        ENTREGADO: 'Entregado',
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-2xl p-0 gap-0 overflow-hidden bg-white shadow-2xl border-none">

                {/* ── HEADER PREMIUM ── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-5 text-white">
                    {/* decorative circle */}
                    <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-monchito-purple/20 pointer-events-none" />

                    <DialogHeader className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {/* Catalog avatar */}
                                <div className="w-10 h-10 rounded-xl bg-monchito-purple/30 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-black text-white">
                                        {(order.brand?.name || order.brandName || '?')[0].toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <DialogTitle className="text-sm sm:text-base font-black uppercase tracking-tight leading-tight">
                                        {order.brand?.name || order.brandName || 'Pedido'}
                                    </DialogTitle>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                        {order.orderNumber || order.receiptNumber}
                                    </p>
                                </div>
                            </div>
                            {/* Status pill */}
                            <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${statusColor[order.status] || 'bg-slate-100 text-slate-600'}`}>
                                {statusLabel[order.status] || order.status}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2.5 uppercase tracking-widest font-bold">Editar datos del pedido</p>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col max-h-[75vh] sm:max-h-[80vh]">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">

                        {/* ── FINANCE CARD ── */}
                        <div className="mx-4 mt-4 sm:mx-5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                            <div className="bg-slate-900/5 px-4 py-2.5 border-b border-slate-100">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valores del Pedido</p>
                            </div>
                            <div className="bg-white px-4 py-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Total</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">$</span>
                                            <DecimalTextField
                                                className="h-11 pl-7 text-sm font-black text-slate-900 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-monchito-purple/20 bg-white transition-shadow"
                                                value={Number(formData.total) || 0}
                                                onValueChange={(n) => setFormData({ ...formData, total: n })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Abono inicial</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm pointer-events-none">$</span>
                                            <DecimalTextField
                                                className="h-11 pl-7 text-sm font-black text-emerald-700 border border-slate-200 bg-white rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-400/20 transition-shadow"
                                                value={Number(formData.deposit) || 0}
                                                onValueChange={(n) =>
                                                    setFormData({ ...formData, deposit: Math.max(0, Math.min(n, Number(formData.total) || 0)) })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Saldo visual pill */}
                                <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${saldo > 0.01 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Saldo Pendiente</span>
                                    <span className={`text-lg font-black tabular-nums ${saldo > 0.01 ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {fmt(saldo)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── DETAILS CARD ── */}
                        <div className="mx-4 mt-3 sm:mx-5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                            <div className="bg-slate-900/5 px-4 py-2.5 border-b border-slate-100">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Detalles</p>
                            </div>
                            <div className="bg-white px-4 py-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Catálogo</Label>
                                        <div className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs font-black text-slate-600 uppercase tracking-tight">
                                            {order.brand?.name || order.brandName || '—'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">N° Pedido</Label>
                                        <Input
                                            value={formData.orderNumber}
                                            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                            placeholder="Ej: PD-2026-001"
                                            className="h-11 text-sm font-mono border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-monchito-purple/20 transition-shadow"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Fecha de Entrega Estimada</Label>
                                    <Input
                                        type="date"
                                        value={formData.possibleDeliveryDate}
                                        onChange={(e) => setFormData({ ...formData, possibleDeliveryDate: e.target.value })}
                                        required
                                        className="h-11 text-sm border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-monchito-purple/20 transition-shadow"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── PAYMENT CARD ── */}
                        <div className="mx-4 mt-3 mb-4 sm:mx-5 sm:mb-5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                            <div className="bg-slate-900/5 px-4 py-2.5 border-b border-slate-100">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Método de Pago</p>
                            </div>
                            <div className="bg-white px-4 py-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 flex items-center gap-1.5">
                                            Método {hasExistingDeposit && <Lock className="h-3 w-3 text-slate-300" />}
                                        </Label>
                                        {hasExistingDeposit ? (
                                            <div className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-400">
                                                <span>{originalMethod === 'BILLETERA_VIRTUAL' ? 'BILLETERA' : originalMethod}</span>
                                                <Lock className="h-3 w-3 text-slate-300" />
                                            </div>
                                        ) : (
                                            <select
                                                className="w-full h-11 rounded-xl border border-slate-200 text-sm px-3 focus:ring-2 focus:ring-monchito-purple/10 outline-none appearance-none bg-white font-semibold text-slate-700"
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
                                            <p className="text-[9px] text-slate-300 pl-0.5">Bloqueado · abono registrado</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Cuenta</Label>
                                        {hasExistingDeposit || formData.paymentMethod === 'BILLETERA_VIRTUAL' ? (
                                            <div className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300">
                                                <span className="truncate">
                                                    {originalMethod === 'BILLETERA_VIRTUAL'
                                                        ? 'No aplica'
                                                        : (bankAccounts.find(a => a.id === originalBankAccountId)?.name || 'Efectivo')}
                                                </span>
                                                <Lock className="h-3 w-3 shrink-0" />
                                            </div>
                                        ) : (
                                            <select
                                                className="w-full h-11 rounded-xl border border-slate-200 text-sm px-3 focus:ring-2 focus:ring-monchito-purple/10 outline-none appearance-none bg-white font-semibold text-slate-700"
                                                value={formData.bankAccountId}
                                                onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                            >
                                                <option value="">Seleccione cuenta...</option>
                                                {filteredBankAccounts.map((acc: any) => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="px-4 py-3 sm:px-5 sm:py-4 bg-white border-t border-slate-100 flex gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateOrder.isPending}
                            className="h-11 font-bold text-slate-500 rounded-xl px-5 border-slate-200 hover:bg-slate-50 flex-1 sm:flex-none"
                        >
                            Cancelar
                        </Button>
                        <AsyncButton
                            type="submit"
                            isLoading={updateOrder.isPending}
                            className="flex-1 h-11 bg-monchito-purple hover:bg-monchito-purple/90 text-white rounded-xl font-black uppercase tracking-widest text-xs px-6 shadow-lg shadow-monchito-purple/20 active:scale-95 transition-all"
                        >
                            Guardar Cambios
                        </AsyncButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
