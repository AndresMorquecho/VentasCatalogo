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
import { Lock, AlertTriangle, DollarSign, Calendar, FileText } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { useBrandList } from "@/features/brands/api/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"
import { SearchableSelect } from "@/shared/ui/SearchableSelect"

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
        bankAccountId: originalBankAccountId,
        brandId: order.brandId || ''
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
                bankAccountId: order.bankAccountId || '',
                brandId: order.brandId || ''
            })
            setPriceValue(Number(order.total) || 0)
        }
    }, [open, order])

    const { data: walletData } = useClientCredits(order.clientId || '')
    const walletBalance = walletData?.reduce((acc: number, curr: any) => {
        if (curr.status === 'AVAILABLE') return acc + Number(curr.remainingAmount || 0)
        return acc
    }, 0) || 0

    const { data: brandsResponse } = useBrandList({ limit: 1000 })
    const brands = brandsResponse?.data || []
    const activeBrands = useMemo(() => getActiveBrands(brands), [brands])
    const brandOptions = useMemo(() => {
        const list = [...activeBrands]
        if (order.brandId && !list.some(b => b.id === order.brandId)) {
            list.push({
                id: order.brandId,
                name: order.brand?.name || order.brandName || 'Marca original',
                isActive: true,
                createdAt: new Date().toISOString()
            } as any)
        }
        return list.map(b => ({ id: b.id, label: b.name.toUpperCase() }))
    }, [activeBrands, order.brandId, order.brand, order.brandName])

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

            const selectedBrand = brandOptions.find(b => b.id === formData.brandId)
            const finalBrandName = selectedBrand?.label || order.brand?.name || order.brandName || 'Marca'

            const payload = {
                total: formData.total,
                possibleDeliveryDate: formData.possibleDeliveryDate,
                orderNumber: formData.orderNumber,
                brandId: formData.brandId,
                brandName: finalBrandName,
                items: [{
                    id: order.items?.[0]?.id || crypto.randomUUID(),
                    productName: finalBrandName,
                    quantity,
                    unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                    brandId: formData.brandId,
                    brandName: finalBrandName
                }],
                deposit: formData.deposit,
                paymentMethod: hasExistingDeposit ? originalMethod : formData.paymentMethod,
                bankAccountId: (hasExistingDeposit ? originalBankAccountId : formData.bankAccountId) || null
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
                <DialogContent className="max-w-2xl w-[95vw] sm:w-full rounded-2xl p-0 gap-0 overflow-hidden bg-white shadow-2xl border-none">
                    {/* ── HEADER PREMIUM (LIGHT STYLE) ── */}
                    <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-amber-500/5 to-amber-500/10 border-b">
                        <div className="flex items-start justify-between gap-3 w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-800 uppercase leading-none">
                                        Corrección de Precio
                                    </DialogTitle>
                                    <p className="text-xs text-slate-500 mt-1.5 font-semibold">
                                        {order.brand?.name || order.brandName} · <span className="font-mono text-amber-600 font-bold">{order.orderNumber || order.receiptNumber}</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Edición restringida. Solo se permite corregir el precio total.
                                    </p>
                                </div>
                            </div>
                            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                                Solo Precio
                            </span>
                        </div>
                    </DialogHeader>

                    {/* Body horizontal */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/20">
                        {/* Columna Izquierda: Input precio */}
                        <div className="space-y-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest">
                                        Modificar Valor
                                    </h3>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                        Nuevo Precio Total
                                    </Label>
                                    <div className="relative group">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-sm pointer-events-none group-focus-within:text-amber-700 transition-colors">$</span>
                                        <DecimalTextField
                                            className="h-11 pl-8 text-sm font-black text-amber-900 border-2 border-amber-300 rounded-xl focus-visible:ring-2 focus-visible:ring-amber-400/20 focus-visible:border-amber-500/50 bg-amber-50/30 transition-all shadow-sm"
                                            value={priceValue}
                                            onValueChange={setPriceValue}
                                        />
                                    </div>
                                </div>

                                {newPriceSaldo > 0.01 && (
                                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                                            El pedido quedará con saldo pendiente de <strong>${newPriceSaldo.toFixed(2)}</strong>. Podrás abonarlo desde el módulo de abonos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Columna Derecha: Información y por qué está bloqueado */}
                        <div className="space-y-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                        Estado y Bloqueo
                                    </h3>
                                </div>

                                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                                    <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        La edición completa de abonos y detalles está bloqueada porque este pedido ya tiene abonos adicionales registrados. Solo puedes corregir el precio total.
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Precio Actual</span>
                                        <span className="font-bold text-slate-700">${Number(order.total).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Total Abonado</span>
                                        <span className="font-bold text-emerald-600">${totalPaid.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs py-1">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Nuevo Saldo</span>
                                        <span className={`font-bold ${newPriceSaldo > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            ${newPriceSaldo.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-11 font-bold text-slate-500 rounded-xl px-6 border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handlePriceUpdate}
                            disabled={isSavingPrice}
                            className="h-11 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl uppercase tracking-widest px-8 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
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
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full rounded-2xl p-0 gap-0 overflow-hidden bg-white shadow-2xl border-none">

                {/* ── HEADER PREMIUM (LIGHT STYLE MATCHING CLIENTFORM) ── */}
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                    <div className="flex items-start justify-between gap-3 w-full">
                        <div className="flex items-center gap-3">
                            {/* Catalog/Brand avatar icon box */}
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-sm font-black">
                                <span className="text-sm uppercase text-primary">
                                    {(order.brand?.name || order.brandName || '?')[0].toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight text-slate-800 uppercase leading-none">
                                    {order.brand?.name || order.brandName || 'Pedido'}
                                </DialogTitle>
                                <p className="text-xs text-slate-500 mt-1.5 font-semibold">
                                    N° Pedido: <span className="font-mono text-primary font-bold">{order.orderNumber || order.receiptNumber}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Modifique los datos y valores del pedido seleccionado.
                                </p>
                            </div>
                        </div>
                        {/* Status pill */}
                        <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColor[order.status] || 'bg-slate-100 text-slate-600'}`}>
                            {statusLabel[order.status] || order.status}
                        </span>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col bg-slate-50/20">
                    {/* ── GRID LAYOUT HORIZONTAL ── */}
                    <div className="p-6 pb-28 space-y-6 overflow-y-auto max-h-[60vh] sm:max-h-[65vh] custom-scrollbar">
                        
                        {/* ── ROW 1: VALORES FINANCIEROS (Full width) ── */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <div className="p-2 bg-monchito-purple/10 text-monchito-purple rounded-xl shrink-0">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <h3 className="text-xs font-black text-monchito-purple uppercase tracking-widest">
                                    Valores del Pedido
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Valor Total</Label>
                                    <div className="relative group">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none group-focus-within:text-monchito-purple transition-colors">$</span>
                                        <DecimalTextField
                                            className="h-11 pl-8 text-sm font-black text-slate-900 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-monchito-purple/20 focus-visible:border-monchito-purple/50 bg-white transition-all shadow-sm"
                                            value={Number(formData.total) || 0}
                                            onValueChange={(n) => setFormData({ ...formData, total: n })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Abono Inicial</Label>
                                    <div className="relative group">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm pointer-events-none group-focus-within:text-emerald-600 transition-colors">$</span>
                                        <DecimalTextField
                                            className="h-11 pl-8 text-sm font-black text-emerald-700 border border-slate-200 bg-white rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-400/20 focus-visible:border-emerald-500/50 transition-all shadow-sm"
                                            value={Number(formData.deposit) || 0}
                                            onValueChange={(n) =>
                                                setFormData({ ...formData, deposit: Math.max(0, Math.min(n, Number(formData.total) || 0)) })
                                            }
                                            emptyWhenZero={false}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Saldo visual pill */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Saldo Pendiente</Label>
                                    <div className={`flex items-center justify-between h-11 px-4 rounded-xl border transition-all duration-300 ${
                                        saldo > 0.01 
                                            ? 'bg-rose-50 border-rose-100 text-rose-700 shadow-sm shadow-rose-100/10' 
                                            : 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow-sm shadow-emerald-100/10'
                                    }`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                                        <span className={`text-lg font-black tabular-nums tracking-tight ${saldo > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {fmt(saldo)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── ROW 2: DETALLES & MÉTODOS DE PAGO (Two columns side-by-side) ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Detalles */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 h-full">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <div className="p-2 bg-monchito-purple/10 text-monchito-purple rounded-xl shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-xs font-black text-monchito-purple uppercase tracking-widest">
                                        Detalles del Pedido
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Catálogo</Label>
                                        <SearchableSelect
                                            options={brandOptions}
                                            value={formData.brandId}
                                            onChange={(val) => setFormData({ ...formData, brandId: val })}
                                            placeholder="Seleccione catálogo..."
                                            className="!h-11 !rounded-xl !text-sm font-black text-slate-700 uppercase"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <div className="h-8 flex items-end pb-1">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 leading-none">N° Pedido</Label>
                                            </div>
                                            <Input
                                                value={formData.orderNumber}
                                                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                                placeholder="Ej: PD-2026-001"
                                                className="h-11 text-sm font-mono border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-monchito-purple/20 focus-visible:border-monchito-purple/50 transition-all bg-white shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="h-8 flex items-end pb-1">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 leading-tight">Fecha de Entrega Estimada</Label>
                                            </div>
                                            <div className="relative group">
                                                <Input
                                                    type="date"
                                                    value={formData.possibleDeliveryDate}
                                                    onChange={(e) => setFormData({ ...formData, possibleDeliveryDate: e.target.value })}
                                                    required
                                                    className="h-11 text-sm border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-monchito-purple/20 focus-visible:border-monchito-purple/50 transition-all bg-white shadow-sm pr-10"
                                                />
                                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-focus-within:text-monchito-purple transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Método de Pago */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 h-full">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <div className="p-2 bg-monchito-purple/10 text-monchito-purple rounded-xl shrink-0">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-xs font-black text-monchito-purple uppercase tracking-widest">
                                        Método de Pago
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-start">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                            Método
                                        </Label>
                                        {hasExistingDeposit ? (
                                            <div className="h-11 px-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-black text-slate-400 shadow-sm">
                                                <span>{originalMethod === 'BILLETERA_VIRTUAL' ? 'BILLETERA' : originalMethod}</span>
                                                <Lock className="h-3.5 w-3.5 text-slate-400" />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    className="w-full h-11 rounded-xl border border-slate-200 text-sm px-3 focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple/50 outline-none appearance-none bg-white font-semibold text-slate-700 shadow-sm transition-all"
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
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
                                            </div>
                                        )}
                                        {hasExistingDeposit && (
                                            <p className="text-[9px] text-slate-400 font-bold pl-1 mt-1 leading-tight">Bloqueado · abono registrado</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cuenta</Label>
                                        {hasExistingDeposit || formData.paymentMethod === 'BILLETERA_VIRTUAL' ? (
                                            <div className="h-11 px-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-black text-slate-400 shadow-sm">
                                                <span className="truncate">
                                                    {originalMethod === 'BILLETERA_VIRTUAL'
                                                        ? 'No aplica'
                                                        : (bankAccounts.find(a => a.id === originalBankAccountId)?.name || 'Efectivo')}
                                                </span>
                                                <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    className="w-full h-11 rounded-xl border border-slate-200 text-sm px-3 focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple/50 outline-none appearance-none bg-white font-semibold text-slate-700 shadow-sm transition-all"
                                                    value={formData.bankAccountId}
                                                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                                >
                                                    <option value="">Seleccione cuenta...</option>
                                                    {filteredBankAccounts.map((acc: any) => (
                                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                    ))}
                                                </select>
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateOrder.isPending}
                            className="h-11 font-bold text-slate-500 rounded-xl px-6 border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                        >
                            Cancelar
                        </Button>
                        <AsyncButton
                            type="submit"
                            isLoading={updateOrder.isPending}
                            className="h-11 bg-monchito-purple hover:bg-monchito-purple/90 text-white rounded-xl font-black uppercase tracking-widest text-xs px-8 shadow-lg shadow-monchito-purple/20 active:scale-95 transition-all"
                        >
                            Guardar Cambios
                        </AsyncButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
