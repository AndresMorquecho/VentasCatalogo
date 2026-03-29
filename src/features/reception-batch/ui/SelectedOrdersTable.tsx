import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import type { Order } from "@/entities/order/model/types"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { X, CheckCircle, DollarSign, ArrowRight } from "lucide-react"
import { CreditActionSelectorModal } from "./CreditActionSelectorModal"
import { CreditDistributionModal } from "./CreditDistributionModal"
import { getPaidAmount } from "@/entities/order/model/model"

export interface SelectedOrderState {
    order: Order
    finalTotal: number
    finalInvoiceNumber: string
    documentType: string
    entryDate: string
    creditDistribution?: CreditDistribution 
}

interface Props {
    orders: SelectedOrderState[]
    onRemove: (ids: string[]) => void
    onUpdateInvoiceTotal: (id: string, val: number) => void
    onUpdateInvoiceNumber: (id: string, val: string) => void
    onUpdateDocumentType: (id: string, val: string) => void
    onUpdateEntryDate: (id: string, val: string) => void
    onUpdateCreditDistribution?: (id: string, distribution: CreditDistribution) => void 
}

export function SelectedOrdersTable({
    orders,
    onRemove,
    onUpdateInvoiceTotal,
    onUpdateInvoiceNumber,
    onUpdateDocumentType,
    onUpdateEntryDate,
    onUpdateCreditDistribution
}: Props) {
    const [creditModalState, setCreditModalState] = useState<{
        selectorOpen: boolean
        distributionOpen: boolean
        sourceOrder?: SelectedOrderState
        creditAmount: number
        initialRemainingAction?: 'wallet' | 'return'
    }>({
        selectorOpen: false,
        distributionOpen: false,
        creditAmount: 0,
        initialRemainingAction: undefined
    })

    const totalEstimate = orders.reduce((sum, o) => sum + Number(o.order.total || 0), 0)
    const totalInvoice = orders.reduce((sum, o) => sum + Number(o.finalTotal || 0), 0)

    const calculateCreditAmount = (orderState: SelectedOrderState) => {
        const initialPaid = getPaidAmount(orderState.order);
        const finalBalance = Number(orderState.finalTotal || 0) - initialPaid;
        return finalBalance < -0.01 ? Math.abs(finalBalance) : 0;
    }

    const handleOpenCreditDistribution = (orderState: SelectedOrderState) => {
        const creditAmount = calculateCreditAmount(orderState);
        if (creditAmount > 0) {
            const isComplex = orderState.creditDistribution && 
                orderState.creditDistribution.distributions.some(d => !!d.targetOrderId);

            setCreditModalState({
                selectorOpen: !isComplex,
                distributionOpen: !!isComplex,
                sourceOrder: orderState,
                creditAmount,
                initialRemainingAction: undefined
            });
        }
    }

    const handleMoveToWallet = () => {
        if (creditModalState.sourceOrder && onUpdateCreditDistribution) {
            const distribution: CreditDistribution = {
                sourceOrderId: creditModalState.sourceOrder.order.id,
                totalCreditAmount: creditModalState.creditAmount,
                distributions: [{
                    amount: creditModalState.creditAmount,
                    description: `Saldo completo guardado en billetera virtual - Origen: Pedido ${creditModalState.sourceOrder.order.receiptNumber}`
                }]
            }
            onUpdateCreditDistribution(creditModalState.sourceOrder.order.id, distribution);
        }
        setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0, initialRemainingAction: undefined });
    }

    const handleReturnToClient = () => {
        setCreditModalState(prev => ({
            ...prev,
            selectorOpen: false,
            distributionOpen: true,
            initialRemainingAction: 'return'
        }));
    }

    const handleDistributeToOrders = () => {
        setCreditModalState(prev => ({
            ...prev,
            selectorOpen: false,
            distributionOpen: true,
            initialRemainingAction: undefined
        }));
    }

    const handleCreditDistribution = (distribution: CreditDistribution) => {
        if (creditModalState.sourceOrder && onUpdateCreditDistribution) {
            onUpdateCreditDistribution(creditModalState.sourceOrder.order.id, distribution);
        }
        setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0, initialRemainingAction: undefined });
    }

    const handleBackToSelector = () => {
        setCreditModalState(prev => ({
            ...prev,
            selectorOpen: true,
            distributionOpen: false
        }));
    }

    const getAvailableOrdersForDistribution = (sourceOrderState: SelectedOrderState) => {
        return orders
            .filter(o => 
                o.order.id !== sourceOrderState.order.id && 
                o.order.clientId === sourceOrderState.order.clientId
            )
            .map(o => {
                const initialPaid = getPaidAmount(o.order);
                const incomingFromOthers = orders.reduce((sum, other) => {
                    if (other.order.id === sourceOrderState.order.id || !other.creditDistribution) return sum;
                    const distToThisOrder = other.creditDistribution.distributions.find(d => d.targetOrderId === o.order.id);
                    return sum + (distToThisOrder?.amount || 0);
                }, 0);

                const pendingAmount = Math.max(0, Number(o.finalTotal || 0) - initialPaid - incomingFromOthers);
                
                return {
                    id: o.order.id,
                    receiptNumber: o.order.receiptNumber,
                    orderNumber: o.order.orderNumber || '',
                    clientName: o.order.clientName,
                    orderType: (o.order.type || 'NORMAL') as any,
                    pendingAmount,
                    totalAmount: Number(o.finalTotal || 0),
                    paidAmount: initialPaid + incomingFromOthers,
                    brandName: o.order.brandName
                };
            })
            .filter(o => o.pendingAmount > 0.01);
    }

    const handleTableKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, rowIndex: number, fieldName: string) => {
        const input = e.currentTarget as HTMLInputElement;
        let selectionStart: number | null = null;
        try {
            selectionStart = input.selectionStart;
        } catch (e) {}

        const valueLength = (input.value || "").length;
        const isNotNumberInput = input.type !== 'number' && input.type !== 'date' && input.tagName !== 'SELECT';

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            // For selects, only navigate if alt key is NOT pressed (to allow opening dropdown)
            if (input.tagName === 'SELECT' && e.altKey) return;
            
            e.preventDefault();
            const nextIndex = e.key === 'ArrowDown' ? rowIndex + 1 : rowIndex - 1;
            const target = document.querySelector(`[data-row-index="${nextIndex}"][data-field-name="${fieldName}"]`) as HTMLElement;
            if (target) {
                target.focus();
                if (target instanceof HTMLInputElement && target.type !== 'number' && target.type !== 'date') {
                    target.select();
                }
            }
        } else if (e.key === 'ArrowLeft') {
            const shouldMove = !isNotNumberInput || selectionStart === 0;
            if (shouldMove) {
                const fields = ['documentType', 'finalInvoiceNumber', 'finalTotal', 'entryDate'];
                const currentIndex = fields.indexOf(fieldName);
                if (currentIndex > 0) {
                    const prevField = fields[currentIndex - 1];
                    const targetInput = document.querySelector(`[data-row-index="${rowIndex}"][data-field-name="${prevField}"]`) as HTMLElement;
                    if (targetInput) {
                        e.preventDefault();
                        targetInput.focus();
                        if (targetInput instanceof HTMLInputElement && targetInput.type !== 'number' && targetInput.type !== 'date') {
                            targetInput.select();
                        }
                    }
                }
            }
        } else if (e.key === 'ArrowRight') {
            const shouldMove = !isNotNumberInput || selectionStart === valueLength;
            if (shouldMove) {
                const fields = ['documentType', 'finalInvoiceNumber', 'finalTotal', 'entryDate'];
                const currentIndex = fields.indexOf(fieldName);
                if (currentIndex < fields.length - 1) {
                    const nextField = fields[currentIndex + 1];
                    const targetInput = document.querySelector(`[data-row-index="${rowIndex}"][data-field-name="${nextField}"]`) as HTMLElement;
                    if (targetInput) {
                        e.preventDefault();
                        targetInput.focus();
                        if (targetInput instanceof HTMLInputElement && targetInput.type !== 'number' && targetInput.type !== 'date') {
                            targetInput.select();
                        }
                    }
                }
            }
        }
    }

    if (orders.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-200 rounded-lg bg-emerald-50 text-emerald-400">
                <p>Selecciona pedidos para recibir...</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="flex-1 overflow-auto">
                    <Table className="min-w-[1200px] w-full">
                        <TableHeader>
                            <TableRow className="bg-monchito-purple/5 hover:bg-monchito-purple/5 border-b border-monchito-purple/10 h-12 sticky top-0 z-10">
                                <TableHead className="w-[30px] p-1 text-center text-[10px] font-black text-monchito-purple uppercase tracking-widest">#</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Recibo</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Empresaria</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">N° de pedido</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Tipo</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Catálogo</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Valor pedido</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Abono</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Tipo documento</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Factura</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Valor factura</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Fecha ingreso</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center">Saldo</TableHead>
                                <TableHead className="w-[30px] p-1"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((orderState) => {
                                const { order, finalTotal, finalInvoiceNumber, documentType, entryDate } = orderState;
                                const initialPaid = getPaidAmount(order);
                                const incomingDistributiveCredit = orders.reduce((sum, o) => {
                                    if (!o.creditDistribution) return sum;
                                    const distToThisOrder = o.creditDistribution.distributions.find(d => d.targetOrderId === order.id);
                                    return sum + (distToThisOrder?.amount || 0);
                                }, 0);

                                const finalBalance = Number(finalTotal || 0) - initialPaid - incomingDistributiveCredit;
                                const creditAmount = calculateCreditAmount(orderState);
                                const hasCreditDistribution = !!orderState.creditDistribution;
                                const mismatch = Math.abs(Number(order.total || 0) - Number(finalTotal || 0)) > 0.01;

                                return (
                                    <TableRow key={order.id} className={`group hover:bg-monchito-purple/5 transition-colors border-b border-slate-50 ${mismatch ? 'bg-amber-50/30' : ''}`}>
                                        <TableCell className="p-1 w-[30px] text-center py-4">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                                        </TableCell>
                                        <TableCell className="py-4 px-2 font-mono text-xs font-medium text-center">#{order.receiptNumber}</TableCell>
                                        <TableCell className="py-4 px-2 text-xs font-bold text-center">{order.clientName}</TableCell>
                                        <TableCell className="py-4 px-2 text-xs font-medium text-center">{order.orderNumber || '---'}</TableCell>
                                        <TableCell className="py-4 px-2 text-[10px] text-center">
                                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                                                order.type === 'CAMBIO' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                order.type === 'REPROGRAMACION' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                order.type === 'PREVENTA' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                order.type === 'CATALOGO' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                'bg-blue-100 text-blue-700 border-blue-200'
                                            }`}>
                                                {order.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-2 text-xs font-medium text-center">{order.brandName}</TableCell>
                                        <TableCell className="py-4 px-2 text-center font-mono text-xs font-bold">${Number(order.total || 0).toFixed(2)}</TableCell>
                                        <TableCell className="py-4 px-2 text-center font-mono text-xs font-bold text-blue-600">
                                            <div className="flex flex-col items-center">
                                                <span>${initialPaid.toFixed(2)}</span>
                                                {incomingDistributiveCredit > 0 && (
                                                    <span className="text-[9px] text-emerald-600 flex items-center justify-center gap-1">
                                                        <ArrowRight className="h-2 w-2" /> +${incomingDistributiveCredit.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-2 text-center">
                                            <select
                                                value={documentType}
                                                onChange={(e) => onUpdateDocumentType(order.id, e.target.value)}
                                                onKeyDown={(e) => handleTableKeyDown(e as any, orders.indexOf(orderState), 'documentType')}
                                                data-row-index={orders.indexOf(orderState)}
                                                data-field-name="documentType"
                                                className="h-7 text-[10px] w-24 bg-white border border-monchito-purple/20 rounded px-1 focus:outline-none focus:ring-1 focus:ring-monchito-purple/20 text-center mx-auto"
                                            >
                                                <option value="FACTURA">FACTURA</option>
                                                <option value="TICKET">TICKET</option>
                                                <option value="GUIA">GUÍA</option>
                                                <option value="OTROS">OTROS</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="py-4 px-2 text-center">
                                            <Input
                                                value={finalInvoiceNumber}
                                                onChange={(e) => onUpdateInvoiceNumber(order.id, e.target.value)}
                                                onKeyDown={(e) => handleTableKeyDown(e, orders.indexOf(orderState), 'finalInvoiceNumber')}
                                                data-row-index={orders.indexOf(orderState)}
                                                data-field-name="finalInvoiceNumber"
                                                className="h-7 text-xs bg-white border-monchito-purple/20 px-2 w-24 focus:ring-monchito-purple/20 text-center mx-auto"
                                                placeholder="#"
                                            />
                                        </TableCell>
                                        <TableCell className="py-4 px-2 text-center">
                                            <Input
                                                type="number"
                                                min={0}
                                                value={finalTotal}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    onUpdateInvoiceTotal(order.id, isNaN(val) ? 0 : val);
                                                }}
                                                onKeyDown={(e) => handleTableKeyDown(e, orders.indexOf(orderState), 'finalTotal')}
                                                data-row-index={orders.indexOf(orderState)}
                                                data-field-name="finalTotal"
                                                className={`h-7 text-xs px-2 text-center font-mono bg-white border-monchito-purple/20 focus:ring-monchito-purple/20 font-bold w-24 hide-spinner mx-auto ${mismatch ? 'text-amber-700 bg-amber-50' : 'text-monchito-purple'}`}
                                            />
                                        </TableCell>
                                        <TableCell className="py-4 px-2 text-center font-normal">
                                            <Input
                                                type="date"
                                                value={entryDate}
                                                onChange={(e) => onUpdateEntryDate(order.id, e.target.value)}
                                                onKeyDown={(e) => handleTableKeyDown(e, orders.indexOf(orderState), 'entryDate')}
                                                data-row-index={orders.indexOf(orderState)}
                                                data-field-name="entryDate"
                                                className="h-7 text-xs px-1 w-28 bg-white border-monchito-purple/20 focus:ring-monchito-purple/20 text-center font-normal mx-auto"
                                            />
                                        </TableCell>
                                        <TableCell className={`py-4 px-2 text-center font-mono font-bold text-xs`}>
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={finalBalance < -0.01 ? 'text-emerald-600' : finalBalance > 0.01 ? 'text-amber-600' : 'text-slate-400'}>
                                                    {finalBalance < -0.01 ? 'Favor: ' : ''}${Math.abs(finalBalance).toFixed(2)}
                                                </span>
                                                {creditAmount > 0 && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenCreditDistribution(orderState)}
                                                        className={`h-6 px-2 text-[10px] flex items-center gap-1 ${
                                                            hasCreditDistribution 
                                                                ? 'bg-monchito-purple text-white border-monchito-purple hover:bg-monchito-purple/90 shadow-sm' 
                                                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                        }`}
                                                        title={`Distribuir $${creditAmount.toFixed(2)} de saldo a favor`}
                                                    >
                                                        <DollarSign className="h-3 w-3" />
                                                        {hasCreditDistribution ? 'Ver/Editar' : 'Distribuir'}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-1 w-[30px] text-center py-4">
                                            <button
                                                onClick={() => onRemove([order.id])}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                <div className="bg-monchito-purple/5 border-t border-monchito-purple/10 p-3 flex justify-end gap-12 pr-16 shrink-0 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-monchito-purple tracking-widest">Total Pedidos:</span>
                        <span className="font-mono font-bold text-amber-700">${totalEstimate.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-monchito-purple tracking-widest">Total Packing:</span>
                        <span className="font-mono font-bold text-monchito-purple">${totalInvoice.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {creditModalState.sourceOrder && (
                <CreditActionSelectorModal
                    isOpen={creditModalState.selectorOpen}
                    onClose={() => setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0, initialRemainingAction: undefined })}
                    sourceOrder={{
                        id: creditModalState.sourceOrder.order.id,
                        receiptNumber: creditModalState.sourceOrder.order.receiptNumber,
                        orderNumber: creditModalState.sourceOrder.order.orderNumber || '',
                        clientName: creditModalState.sourceOrder.order.clientName,
                        orderType: (creditModalState.sourceOrder.order.type || 'NORMAL') as any
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
                    onClose={() => setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0, initialRemainingAction: undefined })}
                    sourceOrder={{
                        id: creditModalState.sourceOrder.order.id,
                        receiptNumber: creditModalState.sourceOrder.order.receiptNumber,
                        orderNumber: creditModalState.sourceOrder.order.orderNumber || '',
                        clientId: creditModalState.sourceOrder.order.clientId,
                        clientName: creditModalState.sourceOrder.order.clientName,
                        orderType: creditModalState.sourceOrder.order.type || 'NORMAL'
                    }}
                    creditAmount={creditModalState.creditAmount}
                    availableOrders={getAvailableOrdersForDistribution(creditModalState.sourceOrder)}
                    onDistribute={handleCreditDistribution}
                    initialDistribution={creditModalState.sourceOrder.creditDistribution}
                    initialRemainingAction={creditModalState.initialRemainingAction}
                    onBack={handleBackToSelector}
                />
            )}
        </div>
    )
}
