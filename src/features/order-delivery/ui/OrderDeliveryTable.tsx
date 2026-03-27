import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { AlertTriangle, DollarSign, ArrowRight } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Check, Edit2, Loader2 } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { useNotifications } from "@/shared/lib/notifications"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { CreditActionSelectorModal } from "./CreditActionSelectorModal"
import { CreditDistributionModal } from "./CreditDistributionModal"

interface OrderDeliveryTableProps {
    orders: Order[]
    selectedOrderIds: string[]
    onSelectionChange: (ids: string[]) => void
    // Credit distribution state tracked externally (per-order)
    creditDistributions?: Record<string, CreditDistribution>
    onUpdateCreditDistribution?: (orderId: string, dist: CreditDistribution) => void
}

function EditableCell({
    orderId,
    value,
    field,
    placeholder,
    type = "text"
}: {
    orderId: string,
    value: string | number | null | undefined,
    field: "invoiceNumber" | "creditNoteNumber" | "creditNoteTotal" | "realInvoiceTotal",
    placeholder: string,
    type?: "text" | "number"
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [tempValue, setTempValue] = useState(value?.toString() || '')
    const [isSaving, setIsSaving] = useState(false)
    const qc = useQueryClient()
    const { notifySuccess, notifyError } = useNotifications()

    const handleSave = async () => {
        if (tempValue === value?.toString()) {
            setIsEditing(false)
            return
        }
        setIsSaving(true)
        try {
            const numericFields = ["creditNoteTotal", "realInvoiceTotal"]
            const finalValue = numericFields.includes(field) ? parseFloat(tempValue) : tempValue

            await orderApi.update(orderId, { [field]: finalValue })
            notifySuccess('Dato actualizado')
            qc.invalidateQueries({ queryKey: ['orders'] })
            setIsEditing(false)
        } catch (err) {
            notifyError({ message: 'Error al actualizar' })
        } finally {
            setIsSaving(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 min-w-[80px]" onClick={(e) => e.stopPropagation()}>
                <Input
                    autoFocus
                    type={type}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="h-6 text-[10px] p-1 font-bold bg-white"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') setIsEditing(false)
                    }}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50"
                >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
            </div>
        )
    }

    return (
        <div
            className="group flex items-center gap-1 cursor-pointer hover:bg-slate-50 rounded px-1 transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
            <span className={!value ? "text-slate-300 italic" : "text-slate-900 font-bold"}>
                {value || placeholder}
            </span>
            <Edit2 className="h-2 w-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    )
}

function formatDate(date: string) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-EC', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

function formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
}

export function OrderDeliveryTable({
    orders,
    selectedOrderIds,
    onSelectionChange,
    creditDistributions = {},
    onUpdateCreditDistribution
}: OrderDeliveryTableProps) {

    // --- Credit Distribution Modal State ---
    const [creditModalState, setCreditModalState] = useState<{
        selectorOpen: boolean
        distributionOpen: boolean
        sourceOrder: Order | null
        creditAmount: number
        initialRemainingAction?: 'wallet' | 'return'
    }>({ selectorOpen: false, distributionOpen: false, sourceOrder: null, creditAmount: 0 })

    const handleToggleSelect = (order: Order) => {
        if (selectedOrderIds.includes(order.id)) {
            onSelectionChange(selectedOrderIds.filter(id => id !== order.id))
        } else {
            const firstSelectedId = selectedOrderIds[0]
            if (firstSelectedId) {
                const firstOrder = orders.find(o => o.id === firstSelectedId)
                if (firstOrder && firstOrder.clientId !== order.clientId) return
            }
            onSelectionChange([...selectedOrderIds, order.id])
        }
    }

    // Calculate credit surplus for a given order
    const getCreditAmount = (order: Order) => {
        const paidAmount = getPaidAmount(order)
        const creditNoteTotal = Number(order.creditNoteTotal || 0)
        const effectiveTotal = Number(order.realInvoiceTotal || order.total)
        const balance = effectiveTotal - paidAmount - creditNoteTotal
        return balance < -0.01 ? Math.abs(balance) : 0
    }

    const handleOpenCreditDistribution = (order: Order) => {
        const creditAmount = getCreditAmount(order)
        if (creditAmount <= 0) return
        const existingDist = creditDistributions[order.id]
        const isComplex = existingDist?.distributions.some(d => !!d.targetOrderId)
        setCreditModalState({
            selectorOpen: !isComplex,
            distributionOpen: !!isComplex,
            sourceOrder: order,
            creditAmount,
            initialRemainingAction: undefined
        })
    }

    const handleMoveToWallet = () => {
        if (creditModalState.sourceOrder && onUpdateCreditDistribution) {
            const dist: CreditDistribution = {
                sourceOrderId: creditModalState.sourceOrder.id,
                totalCreditAmount: creditModalState.creditAmount,
                distributions: [{
                    amount: creditModalState.creditAmount,
                    description: `Saldo completo guardado en billetera virtual - Origen: Pedido ${creditModalState.sourceOrder.receiptNumber}`
                }]
            }
            onUpdateCreditDistribution(creditModalState.sourceOrder.id, dist)
        }
        setCreditModalState({ selectorOpen: false, distributionOpen: false, sourceOrder: null, creditAmount: 0 })
    }

    const handleReturnToClient = () => {
        setCreditModalState(prev => ({ ...prev, selectorOpen: false, distributionOpen: true, initialRemainingAction: 'return' }))
    }

    const handleDistributeToOrders = () => {
        setCreditModalState(prev => ({ ...prev, selectorOpen: false, distributionOpen: true, initialRemainingAction: undefined }))
    }

    const handleCreditDistribution = (distribution: CreditDistribution) => {
        if (creditModalState.sourceOrder && onUpdateCreditDistribution) {
            onUpdateCreditDistribution(creditModalState.sourceOrder.id, distribution)
        }
        setCreditModalState({ selectorOpen: false, distributionOpen: false, sourceOrder: null, creditAmount: 0 })
    }

    const handleBackToSelector = () => {
        setCreditModalState(prev => ({ ...prev, selectorOpen: true, distributionOpen: false }))
    }

    // Build available orders for distribution (same client, pending balance, not the source)
    const getAvailableOrdersForDistribution = (sourceOrder: Order) => {
        // Calculate how much credit has ALREADY been distributed to each order from OTHER source orders in this same session
        const alreadyDistributedToTarget: Record<string, number> = {}
        Object.entries(creditDistributions).forEach(([sId, distribution]) => {
            if (sId === sourceOrder.id) return // skip the current source being edited
            distribution.distributions.forEach(d => {
                if (d.targetOrderId) {
                    alreadyDistributedToTarget[d.targetOrderId] = (alreadyDistributedToTarget[d.targetOrderId] || 0) + d.amount
                }
            })
        })

        return orders
            .filter(o => o.id !== sourceOrder.id && o.clientId === sourceOrder.clientId)
            .map(o => {
                const paidAmount = getPaidAmount(o)
                const creditNoteTotal = Number(o.creditNoteTotal || 0)
                const effectiveTotal = Number(o.realInvoiceTotal || o.total)
                
                // Subtract what's already distributed from other sources in memory
                const previouslyAllocated = alreadyDistributedToTarget[o.id] || 0
                const pendingAmount = Math.max(0, effectiveTotal - paidAmount - creditNoteTotal - previouslyAllocated)

                return {
                    id: o.id,
                    receiptNumber: o.receiptNumber,
                    orderNumber: o.orderNumber || '',
                    clientName: o.clientName,
                    orderType: (o.type || 'NORMAL') as any,
                    pendingAmount,
                    totalAmount: effectiveTotal,
                    paidAmount,
                    brandName: o.brandName
                }
            })
            .filter(o => o.pendingAmount > 0.01)
    }

    const firstSelectedId = selectedOrderIds[0]
    const selectedClientId = firstSelectedId ? orders.find(o => o.id === firstSelectedId)?.clientId : null

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-450px)] min-h-[400px]">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-monchito-purple/5 backdrop-blur-sm">
                        <TableRow className="hover:bg-transparent border-b border-monchito-purple/10">
                            <TableHead className="w-[40px] text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Sel.</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Pedido Por</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Recibo</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Empresaria</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">No. Pedido</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Tipo</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Catalogo</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">V. Pedido</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Abono</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center min-w-[120px]">Factura / N.C.</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">V. Factura</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">F. Ingreso</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Saldo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={13} className="h-24 text-center">
                                    No hay pedidos listos para entrega.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const isSelected = selectedOrderIds.includes(order.id)
                                const isDisabled = selectedClientId !== null && order.clientId !== selectedClientId

                                const paidAmount = getPaidAmount(order);
                                const creditNoteTotal = order.creditNoteTotal || 0;
                                const effectiveTotal = Number(order.realInvoiceTotal || order.total)
                                
                                // Calculate how much credit this order is RECEIVING from other selected orders
                                const incomingDistFromOthers = Object.entries(creditDistributions).reduce((sum, [sId, dist]) => {
                                    if (sId === order.id) return sum 
                                    const d = dist.distributions.find(dd => dd.targetOrderId === order.id)
                                    return sum + (d?.amount || 0)
                                }, 0)

                                const actualPending = effectiveTotal - paidAmount - creditNoteTotal - incomingDistFromOthers;
                                const pendingForDisplay = Math.max(0, actualPending);
                                const creditAmount = getCreditAmount(order)
                                const hasCreditDist = !!creditDistributions[order.id]

                                const entryDate = formatDate(order.createdAt);

                                let rowClass = "transition-colors hover:bg-monchito-purple/5 border-b border-slate-50"
                                if (isSelected) rowClass = "bg-monchito-purple/10 hover:bg-monchito-purple/15 border-b border-monchito-purple/20"

                                return (
                                    <TableRow
                                        key={order.id}
                                        className={`${rowClass} cursor-pointer`}
                                        onClick={() => !isDisabled && handleToggleSelect(order)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                onChange={() => handleToggleSelect(order)}
                                                className="h-4 w-4 rounded border-slate-300 text-monchito-purple focus:ring-monchito-purple cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-500 text-center uppercase">{order.salesChannel}</TableCell>
                                        <TableCell className="font-mono text-[10px] font-bold text-slate-700 text-center">{order.receiptNumber}</TableCell>
                                        <TableCell className="text-xs font-bold text-slate-900 max-w-[150px] truncate">{order.clientName}</TableCell>
                                        <TableCell className="font-mono text-[10px] font-bold text-blue-600 text-center">{order.orderNumber || '-'}</TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-500 text-center uppercase">{order.type}</TableCell>
                                        <TableCell className="text-[10px] font-black text-monchito-purple text-center uppercase">{order.brandName}</TableCell>
                                        <TableCell className="text-right font-mono text-[11px] font-bold text-slate-700">
                                            ${formatCurrency(order.total)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-[11px] font-bold text-emerald-600">
                                            <div className="flex flex-col items-end">
                                                <span>{formatCurrency(paidAmount)}</span>
                                                {incomingDistFromOthers > 0 && (
                                                    <span className="text-[9px] text-emerald-600 flex items-center gap-1">
                                                        <ArrowRight className="h-2 w-2" /> +{formatCurrency(incomingDistFromOthers)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-center">
                                            {order.creditNoteNumber ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-orange-600 bg-orange-50 px-1 rounded text-[9px]">N.C.</span>
                                                    <EditableCell
                                                        orderId={order.id}
                                                        value={order.creditNoteNumber}
                                                        field="creditNoteNumber"
                                                        placeholder="Nota..."
                                                    />
                                                    {order.creditNoteTotal && Number(order.creditNoteTotal) > 0 && (
                                                        <span className="text-[8px] text-slate-400 font-medium">
                                                            -${Number(order.creditNoteTotal).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-blue-600 bg-blue-50 px-1 rounded text-[9px]">FAC</span>
                                                    <EditableCell
                                                        orderId={order.id}
                                                        value={order.invoiceNumber}
                                                        field="invoiceNumber"
                                                        placeholder="Factura..."
                                                    />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-[11px] font-bold text-slate-700">
                                            <EditableCell
                                                orderId={order.id}
                                                value={order.realInvoiceTotal}
                                                field="realInvoiceTotal"
                                                placeholder="Total"
                                                type="number"
                                            />
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-500 text-center">{entryDate}</TableCell>
                                        <TableCell className="text-right font-mono text-[11px] font-bold">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className={pendingForDisplay > 0.01 ? 'text-red-600' : creditAmount > 0.01 ? 'text-emerald-600' : 'text-slate-400'}>
                                                    {creditAmount > 0.01
                                                        ? `+${formatCurrency(creditAmount)}`
                                                        : formatCurrency(pendingForDisplay)
                                                    }
                                                    {pendingForDisplay > 0.01 && <AlertTriangle className="inline-block ml-1 h-3 w-3 text-red-500" />}
                                                </span>
                                                {creditAmount > 0 && onUpdateCreditDistribution && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => { e.stopPropagation(); handleOpenCreditDistribution(order) }}
                                                        className={`h-6 px-2 text-[9px] flex items-center gap-1 whitespace-nowrap ${hasCreditDist
                                                                ? 'bg-monchito-purple text-white border-monchito-purple hover:bg-monchito-purple/90'
                                                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                                            }`}
                                                    >
                                                        <DollarSign className="h-2.5 w-2.5" />
                                                        {hasCreditDist ? 'Ver/Editar' : 'Distribuir'}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Credit Distribution Modals */}
            {creditModalState.sourceOrder && (
                <CreditActionSelectorModal
                    isOpen={creditModalState.selectorOpen}
                    onClose={() => setCreditModalState({ selectorOpen: false, distributionOpen: false, sourceOrder: null, creditAmount: 0 })}
                    sourceOrder={{
                        id: creditModalState.sourceOrder.id,
                        receiptNumber: creditModalState.sourceOrder.receiptNumber,
                        orderNumber: creditModalState.sourceOrder.orderNumber || '',
                        clientName: creditModalState.sourceOrder.clientName,
                        orderType: creditModalState.sourceOrder.type || 'NORMAL'
                    }}
                    creditAmount={creditModalState.creditAmount}
                    onMoveToWallet={handleMoveToWallet}
                    onReturnToClient={handleReturnToClient}
                    onDistributeToOrders={handleDistributeToOrders}
                />
            )}

            {creditModalState.sourceOrder && (
                <CreditDistributionModal
                    isOpen={creditModalState.distributionOpen}
                    onClose={() => setCreditModalState({ selectorOpen: false, distributionOpen: false, sourceOrder: null, creditAmount: 0 })}
                    sourceOrder={{
                        id: creditModalState.sourceOrder.id,
                        receiptNumber: creditModalState.sourceOrder.receiptNumber,
                        orderNumber: creditModalState.sourceOrder.orderNumber || '',
                        clientId: creditModalState.sourceOrder.clientId,
                        clientName: creditModalState.sourceOrder.clientName,
                        orderType: creditModalState.sourceOrder.type || 'NORMAL'
                    }}
                    creditAmount={creditModalState.creditAmount}
                    availableOrders={getAvailableOrdersForDistribution(creditModalState.sourceOrder)}
                    onDistribute={handleCreditDistribution}
                    initialDistribution={creditModalState.sourceOrder ? creditDistributions[creditModalState.sourceOrder.id] : undefined}
                    initialRemainingAction={creditModalState.initialRemainingAction}
                    onBack={handleBackToSelector}
                />
            )}
        </div>
    )
}
