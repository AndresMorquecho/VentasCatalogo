import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import type { Order } from "@/entities/order/model/types"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { X, CheckCircle, AlertCircle, DollarSign, ArrowRight } from "lucide-react"
import { CreditActionSelectorModal } from "./CreditActionSelectorModal"
import { CreditDistributionModal } from "./CreditDistributionModal"

export interface SelectedOrderState {
    order: Order
    finalTotal: number
    finalInvoiceNumber: string
    documentType: string
    entryDate: string
    creditDistribution?: CreditDistribution // NUEVO: Para distribución de saldos a favor
}

interface Props {
    orders: SelectedOrderState[]
    onRemove: (ids: string[]) => void
    onUpdateInvoiceTotal: (id: string, val: number) => void
    onUpdateInvoiceNumber: (id: string, val: string) => void
    onUpdateDocumentType: (id: string, val: string) => void
    onUpdateEntryDate: (id: string, val: string) => void
    onUpdateCreditDistribution?: (id: string, distribution: CreditDistribution) => void // NUEVO
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
    }>({
        selectorOpen: false,
        distributionOpen: false,
        creditAmount: 0
    })
    const totalEstimate = orders.reduce((sum, o) => sum + Number(o.order.total || 0), 0)
    const totalInvoice = orders.reduce((sum, o) => sum + Number(o.finalTotal || 0), 0)
    // const totalAbono = orders.reduce((sum, o) => sum + (o.abonoRecepcion || 0), 0)

    // Función para calcular saldo a favor
    const calculateCreditAmount = (orderState: SelectedOrderState) => {
        const initialPaid = (orderState.order.payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
        const finalBalance = Number(orderState.finalTotal || 0) - initialPaid;
        return finalBalance < -0.01 ? Math.abs(finalBalance) : 0;
    }

    // Función para abrir modal de distribución
    const handleOpenCreditDistribution = (orderState: SelectedOrderState) => {
        const creditAmount = calculateCreditAmount(orderState);
        if (creditAmount > 0) {
            // Si ya existe una distribución compleja (con pedidos destino), vamos directo a ese modal
            const isComplex = orderState.creditDistribution && 
                orderState.creditDistribution.distributions.some(d => !!d.targetOrderId);

            setCreditModalState({
                selectorOpen: !isComplex,
                distributionOpen: !!isComplex,
                sourceOrder: orderState,
                creditAmount
            });
        }
    }

    // Funciones para manejar las acciones del selector
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
        setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0 });
    }

    const handleReturnToClient = () => {
        if (creditModalState.sourceOrder && onUpdateCreditDistribution) {
            const distribution: CreditDistribution = {
                sourceOrderId: creditModalState.sourceOrder.order.id,
                totalCreditAmount: creditModalState.creditAmount,
                distributions: [{
                    amount: creditModalState.creditAmount,
                    description: `Devolución completa en efectivo - Origen: Pedido ${creditModalState.sourceOrder.order.receiptNumber}`,
                    isCashReturn: true
                }]
            }
            onUpdateCreditDistribution(creditModalState.sourceOrder.order.id, distribution);
        }
        setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0 });
    }

    const handleDistributeToOrders = () => {
        setCreditModalState(prev => ({
            ...prev,
            selectorOpen: false,
            distributionOpen: true
        }));
    }

    // Función para manejar la distribución
    const handleCreditDistribution = (distribution: CreditDistribution) => {
        if (creditModalState.sourceOrder && onUpdateCreditDistribution) {
            onUpdateCreditDistribution(creditModalState.sourceOrder.order.id, distribution);
        }
        setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0 });
    }

    const handleBackToSelector = () => {
        setCreditModalState(prev => ({
            ...prev,
            selectorOpen: true,
            distributionOpen: false
        }));
    }

    // Obtener pedidos disponibles para distribución (mismo cliente, excluyendo el origen)
    const getAvailableOrdersForDistribution = (sourceOrderState: SelectedOrderState) => {
        return orders
            .filter(o => 
                o.order.id !== sourceOrderState.order.id && 
                o.order.clientId === sourceOrderState.order.clientId
            )
            .map(o => {
                const initialPaid = (o.order.payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
                
                // MUY IMPORTANTE: Considerar si otros pedidos de este mismo lote ya le distribuyeron saldo
                // para no permitir distribuir más del saldo real pendiente.
                const incomingFromOthers = orders.reduce((sum, other) => {
                    // Ignorar el pedido que es origen actual de la distribución (sourceOrderState)
                    // e ignorar pedidos que no tienen distribución
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
                    totalAmount: Number(o.finalTotal || 0), // Valor total del pedido
                    paidAmount: initialPaid + incomingFromOthers,  // Abonos totales (previos + batch)
                    brandName: o.order.brandName   // Catálogo
                };
            })
            .filter(o => o.pendingAmount > 0.01); // Solo pedidos con saldo pendiente
    }

    const handleTableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, fieldName: string) => {
        const input = e.currentTarget;
        let selectionStart: number | null = null;
        
        try {
            selectionStart = input.selectionStart;
        } catch (e) {
            // type="number" does not support selectionStart in some browsers
        }

        const valueLength = input.value.length;

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const nextIndex = e.key === 'ArrowDown' ? rowIndex + 1 : rowIndex - 1;
            const target = document.querySelector(`input[data-row-index="${nextIndex}"][data-field-name="${fieldName}"]`) as HTMLInputElement;
            if (target) {
                target.focus();
                if (target.type !== 'number') {
                    target.select();
                }
            }
        } else if (e.key === 'ArrowLeft') {
            // Move to previous column if at start of input (or if numeric input and we can't detect position)
            if (selectionStart === 0 || input.type === 'number') {
                const fields = ['finalInvoiceNumber', 'finalTotal'];
                const currentIndex = fields.indexOf(fieldName);
                if (currentIndex > 0) {
                    const prevField = fields[currentIndex - 1];
                    const targetInput = document.querySelector(
                        `input[data-row-index="${rowIndex}"][data-field-name="${prevField}"]`
                    ) as HTMLInputElement;
                    if (targetInput) {
                        e.preventDefault();
                        targetInput.focus();
                        if (targetInput.type !== 'number') {
                            targetInput.select();
                        }
                    }
                }
            }
        } else if (e.key === 'ArrowRight') {
            // Move to next column if at end of input
            if (selectionStart === valueLength || input.type === 'number') {
                const fields = ['finalInvoiceNumber', 'finalTotal'];
                const currentIndex = fields.indexOf(fieldName);
                if (currentIndex < fields.length - 1) {
                    const nextField = fields[currentIndex + 1];
                    const targetInput = document.querySelector(
                        `input[data-row-index="${rowIndex}"][data-field-name="${nextField}"]`
                    ) as HTMLInputElement;
                    if (targetInput) {
                        e.preventDefault();
                        targetInput.focus();
                        if (targetInput.type !== 'number') {
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
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Recibo</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Empresaria</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">N° de pedido</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Catálogo</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right">Valor pedido</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right">Abono</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Tipo documento</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Factura</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right">Valor factura</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Fecha ingreso</TableHead>
                                <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right">Saldo</TableHead>
                                <TableHead className="w-[30px] p-1"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((orderState) => {
                                const { order, finalTotal, finalInvoiceNumber, documentType, entryDate } = orderState;
                                const initialPaid = (order.payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
                                
                                // Calcular abonos distributivos recibidos de otros pedidos en este mismo lote
                                const incomingDistributiveCredit = orders.reduce((sum, o) => {
                                    if (!o.creditDistribution) return sum;
                                    const distToThisOrder = o.creditDistribution.distributions.find(d => d.targetOrderId === order.id);
                                    return sum + (distToThisOrder?.amount || 0);
                                }, 0);

                                // Current pending based on actual invoice value vs initial paid AND incoming batch credit
                                const finalBalance = Number(finalTotal || 0) - initialPaid - incomingDistributiveCredit;
                                const creditAmount = calculateCreditAmount(orderState);
                                const hasCreditDistribution = !!orderState.creditDistribution;

                                const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}`;
                                
                                // Highlight if Estimate doesn't match Real
                                const mismatch = Math.abs(Number(order.total || 0) - Number(finalTotal || 0)) > 0.01;

                                return (
                                    <TableRow key={order.id} className={`group hover:bg-monchito-purple/5 transition-colors border-b border-slate-50 ${mismatch ? 'bg-amber-50/30' : ''}`}>
                                        <TableCell className="p-1 w-[30px] text-center py-4">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                                        </TableCell>
                                        <TableCell className="py-4 px-2 font-mono text-xs font-medium">#{order.receiptNumber}</TableCell>
                                        <TableCell className="py-4 px-2 text-xs font-bold">{order.clientName}</TableCell>
                                        <TableCell className="py-4 px-2 text-xs font-medium">{order.orderNumber || '---'}</TableCell>
                                        <TableCell className="py-4 px-2 text-xs font-medium">{order.brandName}</TableCell>
                                        
                                        {/* Valor Pedido (Esimated) */}
                                        <TableCell className="py-4 px-2 text-right font-mono text-xs font-bold">${Number(order.total || 0).toFixed(2)}</TableCell>

                                        {/* Abono Anterior + Distributivo (Read Only) */}
                                        <TableCell className="py-4 px-2 text-right font-mono text-xs font-bold text-blue-600">
                                            <div className="flex flex-col items-end">
                                                <span>${initialPaid.toFixed(2)}</span>
                                                {incomingDistributiveCredit > 0 && (
                                                    <span className="text-[9px] text-emerald-600 flex items-center gap-1">
                                                        <ArrowRight className="h-2 w-2" /> +${incomingDistributiveCredit.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Document Type */}
                                        <TableCell className="py-4 px-2">
                                            <select
                                                value={documentType}
                                                onChange={(e) => onUpdateDocumentType(order.id, e.target.value)}
                                                className="h-7 text-[10px] w-24 bg-white border border-monchito-purple/20 rounded px-1 focus:outline-none focus:ring-1 focus:ring-monchito-purple/20"
                                            >
                                                <option value="FACTURA">FACTURA</option>
                                                <option value="TICKET">TICKET</option>
                                                <option value="GUIA">GUÍA</option>
                                                <option value="OTROS">OTROS</option>
                                            </select>
                                        </TableCell>

                                        {/* Invoice Number */}
                                        <TableCell className="py-4 px-2">
                                            <Input
                                                value={finalInvoiceNumber}
                                                onChange={(e) => onUpdateInvoiceNumber(order.id, e.target.value)}
                                                onKeyDown={(e) => handleTableKeyDown(e, orders.indexOf(orderState), 'finalInvoiceNumber')}
                                                data-row-index={orders.indexOf(orderState)}
                                                data-field-name="finalInvoiceNumber"
                                                className="h-7 text-xs bg-white border-monchito-purple/20 px-2 w-16 focus:ring-monchito-purple/20"
                                                placeholder="#"
                                            />
                                        </TableCell>

                                        {/* Valor Factura (Real) */}
                                        <TableCell className="py-4 px-2">
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
                                                className={`h-7 text-xs px-2 text-right font-mono bg-white border-monchito-purple/20 focus:ring-monchito-purple/20 font-bold w-24 hide-spinner ${mismatch ? 'text-amber-700 bg-amber-50' : 'text-monchito-purple'}`}
                                            />
                                        </TableCell>

                                        {/* Fecha Ingreso */}
                                        <TableCell className="py-4 px-2">
                                            <Input
                                                type="date"
                                                value={entryDate}
                                                onChange={(e) => onUpdateEntryDate(order.id, e.target.value)}
                                                className="h-7 text-[10px] px-1 w-24 bg-white border-monchito-purple/20 focus:ring-monchito-purple/20"
                                            />
                                        </TableCell>

                                        {/* Final Saldo */}
                                        <TableCell className={`py-4 px-2 text-right font-mono font-bold text-xs`}>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={finalBalance < -0.01 ? 'text-emerald-600' : finalBalance > 0.01 ? 'text-amber-600' : 'text-slate-400'}>
                                                    {finalBalance < -0.01 ? 'Favor: ' : ''}{fmt(finalBalance)}
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
                {/* Summary Footer */}
                <div className="bg-monchito-purple/5 border-t border-monchito-purple/10 p-3 flex justify-end gap-12 pr-16 shrink-0 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-monchito-purple tracking-widest">Total Pedidos:</span>
                        <span className="font-mono font-bold text-amber-700">${totalEstimate.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-monchito-purple tracking-widest">Total Packing (Facturas):</span>
                        <span className="font-mono font-bold text-monchito-purple">${totalInvoice.toFixed(2)}</span>
                    </div>
                    {Math.abs(totalEstimate - totalInvoice) > 0.01 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 rounded text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-bold">Diferencia: ${Math.abs(totalEstimate - totalInvoice).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Credit Action Selector Modal */}
            {creditModalState.sourceOrder && (
                <CreditActionSelectorModal
                    isOpen={creditModalState.selectorOpen}
                    onClose={() => setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0 })}
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

            {/* Credit Distribution Modal */}
            {creditModalState.sourceOrder && (
                <CreditDistributionModal
                    isOpen={creditModalState.distributionOpen}
                    onClose={() => setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0 })}
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
                    onBack={handleBackToSelector}
                />
            )}
        </div>
    )
}
