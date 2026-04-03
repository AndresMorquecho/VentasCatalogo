import { useState, useMemo, useCallback } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { Eraser, AlertTriangle, DollarSign, ArrowRight, Pin, PinOff } from "lucide-react"
import { Button } from "@/shared/ui/button"
import type { Order } from "@/entities/order/model/types"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { Badge } from "@/shared/ui/badge"
import { CreditActionSelectorModal } from "./CreditActionSelectorModal"
import { CreditDistributionModal } from "./CreditDistributionModal"
import { DismantleModal } from "./DismantleModal"
import { cn } from "@/shared/lib/utils"
import { useAuth } from "@/shared/auth"

interface OrderDeliveryTableProps {
    orders: Order[]
    selectedOrderIds: string[]
    onSelectionChange: (ids: string[]) => void
    creditDistributions: Record<string, CreditDistribution>
    onUpdateCreditDistribution: (orderId: string, distribution: CreditDistribution) => void
    onSuccess?: () => void
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
    creditDistributions,
    onUpdateCreditDistribution,
    onSuccess
}: OrderDeliveryTableProps) {
    const { hasPermission } = useAuth()
    const [creditModalState, setCreditModalState] = useState<{
        selectorOpen: boolean
        distributionOpen: boolean
        sourceOrder?: Order
        creditAmount: number
        initialRemainingAction?: 'wallet' | 'return'
    }>({
        selectorOpen: false,
        distributionOpen: false,
        creditAmount: 0,
        initialRemainingAction: undefined
    })

    const [dismantleModal, setDismantleModal] = useState<{
        isOpen: boolean
        order: Order | null
    }>({
        isOpen: false,
        order: null
    })

    const [pinnedCols, setPinnedCols] = useState<string[]>(() => {
        // En móviles (ancho < 768px), las columnas no están fijas por defecto
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return [];
        }
        return ['Saldo', 'Distribución', 'Acciones'];
    });

    const togglePin = (col: string) => {
        setPinnedCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    };

    const isPinned = (col: string) => pinnedCols.includes(col);

    const calculateCreditAmount = useCallback((order: Order) => {
        const initialPaid = getPaidAmount(order);
        const finalTotal = Number(order.realInvoiceTotal ?? order.total ?? 0);
        const finalBalance = finalTotal - initialPaid;
        return finalBalance < -0.01 ? Math.abs(finalBalance) : 0;
    }, []);

    const handleOpenCreditDistribution = useCallback((order: Order) => {
        const creditAmount = calculateCreditAmount(order);
        if (creditAmount > 0) {
            const existingDist = creditDistributions[order.id];
            const isComplex = existingDist &&
                existingDist.distributions.some(d => !!d.targetOrderId);

            setCreditModalState({
                selectorOpen: !isComplex,
                distributionOpen: !!isComplex,
                sourceOrder: order,
                creditAmount,
                initialRemainingAction: undefined
            });
        }
    }, [calculateCreditAmount, creditDistributions]);

    const handleMoveToWallet = useCallback(() => {
        if (creditModalState.sourceOrder) {
            const distribution: CreditDistribution = {
                sourceOrderId: creditModalState.sourceOrder.id,
                totalCreditAmount: creditModalState.creditAmount,
                distributions: [{
                    amount: creditModalState.creditAmount,
                    description: `Saldo completo guardado en billetera virtual - Origen: Pedido ${creditModalState.sourceOrder.receiptNumber}`
                }]
            }
            onUpdateCreditDistribution(creditModalState.sourceOrder.id, distribution);
        }
        setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0, initialRemainingAction: undefined });
    }, [creditModalState, onUpdateCreditDistribution]);

    const handleReturnToClient = useCallback(() => {
        setCreditModalState(prev => ({
            ...prev,
            selectorOpen: false,
            distributionOpen: true,
            initialRemainingAction: 'return'
        }));
    }, []);

    const handleDistributeToOrders = useCallback(() => {
        setCreditModalState(prev => ({
            ...prev,
            selectorOpen: false,
            distributionOpen: true,
            initialRemainingAction: undefined
        }));
    }, []);

    const handleCreditDistribution = useCallback((distribution: CreditDistribution) => {
        if (creditModalState.sourceOrder) {
            onUpdateCreditDistribution(creditModalState.sourceOrder.id, distribution);
        }
        setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0, initialRemainingAction: undefined });
    }, [creditModalState.sourceOrder, onUpdateCreditDistribution]);

    const handleBackToSelector = useCallback(() => {
        setCreditModalState(prev => ({
            ...prev,
            selectorOpen: true,
            distributionOpen: false
        }));
    }, []);

    const getAvailableOrdersForDistribution = useCallback((sourceOrder: Order) => {
        return orders
            .filter(o =>
                o.id !== sourceOrder.id &&
                o.clientId === sourceOrder.clientId
            )
            .map(o => {
                const initialPaid = getPaidAmount(o);
                const incomingFromOthers = Object.entries(creditDistributions).reduce((sum, [orderId, dist]) => {
                    if (orderId === sourceOrder.id) return sum;
                    const distToThisOrder = dist.distributions.find(d => d.targetOrderId === o.id);
                    return sum + (distToThisOrder?.amount || 0);
                }, 0);

                const totalAmount = Number(o.realInvoiceTotal ?? o.total ?? 0);
                const pendingAmount = Math.max(0, totalAmount - initialPaid - incomingFromOthers);

                return {
                    id: o.id,
                    receiptNumber: o.receiptNumber,
                    orderNumber: o.orderNumber || '',
                    clientName: o.clientName,
                    orderType: (o.type || 'NORMAL') as any,
                    pendingAmount,
                    totalAmount,
                    paidAmount: initialPaid + incomingFromOthers,
                    brandName: o.brandName
                };
            })
            .filter(o => o.pendingAmount > 0.01);
    }, [orders, creditDistributions]);

    const handleToggleSelect = useCallback((order: Order) => {
        if (selectedOrderIds.includes(order.id)) {
            onSelectionChange(selectedOrderIds.filter(id => id !== order.id))
        } else {
            const firstSelectedId = selectedOrderIds[0]
            if (firstSelectedId) {
                const firstOrder = orders.find(o => o.id === firstSelectedId)
                if (firstOrder && firstOrder.clientId !== order.clientId) {
                    return
                }
            }
            onSelectionChange([...selectedOrderIds, order.id])
        }
    }, [selectedOrderIds, orders, onSelectionChange]);

    const incomingCreditsMap = useMemo(() => {
        const map: Record<string, number> = {};
        Object.entries(creditDistributions).forEach(([_, dist]) => {
            dist.distributions.forEach(d => {
                if (d.targetOrderId) {
                    map[d.targetOrderId] = (map[d.targetOrderId] || 0) + d.amount;
                }
            });
        });
        return map;
    }, [creditDistributions]);

    const firstSelectedId = selectedOrderIds[0]
    const firstSelectedOrder = firstSelectedId ? orders.find(o => o.id === firstSelectedId) : null
    const selectedClientId = firstSelectedOrder?.clientId || null

    const handleToggleAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const targetClient = selectedClientId || (orders.length > 0 ? orders[0].clientId : null);
            if (!targetClient) return;

            const idsFromClient = orders
                .filter(o => o.clientId === targetClient)
                .map(o => o.id);
            onSelectionChange(idsFromClient);
        } else {
            onSelectionChange([]);
        }
    }, [selectedClientId, orders, onSelectionChange]);

    const allFromClientSelected = orders.length > 0 && selectedClientId &&
        orders.filter(o => o.clientId === selectedClientId).every(o => selectedOrderIds.includes(o.id));

    return (
        <div className="bg-white rounded-2xl border border-monchito-purple/10 shadow-[0_20px_50px_rgba(107,33,168,0.05)] overflow-hidden">
            <div className="w-full overflow-x-auto custom-scrollbar rounded-t-2xl">
                <Table className="text-left border-collapse min-w-[2000px] w-full">
                    <TableHeader>
                        <TableRow className="bg-monchito-purple/5 border-b border-monchito-purple/10">
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest h-12 text-center">
                                <div className="flex items-center justify-center gap-2 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300"
                                        checked={!!allFromClientSelected}
                                        onChange={handleToggleAll}
                                        disabled={orders.length === 0}
                                    />
                                    <span>Selec.</span>
                                </div>
                            </TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pedido por</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Recibo</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Empresaria</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No de Pedido</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Catalogo</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Valor Pedido</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Abono</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Fecha Posible Entrega</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Factura / NC</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Valor Factura</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Fecha Ingreso</TableHead>
                            
                            <TableHead className={cn(
                                "px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center transition-all duration-300",
                                isPinned('Saldo') && "sticky right-[320px] bg-white z-30 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.1)] border-l border-slate-200 w-[160px] min-w-[160px] max-w-[160px]"
                            )}>
                                <div className="flex items-center justify-center gap-2">
                                    <span>Saldo</span>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 text-slate-300 hover:text-slate-600" onClick={(e) => { e.stopPropagation(); togglePin('Saldo'); }}>
                                        {isPinned('Saldo') ? <Pin className="h-3 w-3 rotate-45" /> : <PinOff className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </TableHead>
                            
                            <TableHead className={cn(
                                "px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center transition-all duration-300",
                                isPinned('Distribución') && "sticky right-[160px] bg-white z-30 border-l border-slate-200 w-[160px] min-w-[160px] max-w-[160px]"
                            )}>
                                <div className="flex items-center justify-center gap-2">
                                    <span>Distribución</span>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 text-slate-300 hover:text-slate-600" onClick={(e) => { e.stopPropagation(); togglePin('Distribución'); }}>
                                        {isPinned('Distribución') ? <Pin className="h-3 w-3 rotate-45" /> : <PinOff className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </TableHead>
                            
                            <TableHead className={cn(
                                "px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center transition-all duration-300",
                                isPinned('Acciones') && "sticky right-0 bg-white z-30 border-l border-slate-200 w-[160px] min-w-[160px] max-w-[160px]"
                            )}>
                                <div className="flex items-center justify-center gap-2">
                                    <span>Acciones</span>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 text-slate-300 hover:text-slate-600" onClick={(e) => { e.stopPropagation(); togglePin('Acciones'); }}>
                                        {isPinned('Acciones') ? <Pin className="h-3 w-3 rotate-45" /> : <PinOff className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="stagger-in">
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={16} className="h-24 text-center text-slate-400 font-medium italic">
                                    No hay pedidos listos para entrega.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const isSelected = selectedOrderIds.includes(order.id)
                                const isDisabled = selectedClientId !== null && order.clientId !== selectedClientId

                                const initialPaid = getPaidAmount(order)
                                const incomingDistributiveCredit = incomingCreditsMap[order.id] || 0;

                                const totalAmount = order.realInvoiceTotal ?? order.total ?? 0
                                const saldo = Math.max(0, totalAmount - initialPaid - incomingDistributiveCredit)
                                const creditAmount = calculateCreditAmount(order)
                                const hasDistribution = !!creditDistributions[order.id]

                                return (
                                    <TableRow
                                        key={order.id}
                                        className={cn(
                                            "group border-b border-monchito-purple/5 transition-all duration-200 cursor-pointer",
                                            isSelected ? "bg-monchito-purple/[0.03]" : "hover:bg-monchito-purple/[0.02]"
                                        )}
                                        onClick={() => !isDisabled && handleToggleSelect(order)}
                                    >
                                        <TableCell className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                onChange={() => handleToggleSelect(order)}
                                                className="h-4 w-4 rounded border-slate-300 text-monchito-purple"
                                            />
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase whitespace-nowrap">{order.salesChannel || '-'}</TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{order.receiptNumber}</TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-0.5 text-center">
                                                <span className="text-sm font-bold text-slate-800 leading-tight whitespace-nowrap">{order.clientName}</span>
                                                {order.clientIdentification && (
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{order.clientIdentification}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-mono text-slate-600 whitespace-nowrap">{order.orderNumber || '-'}</TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase">
                                                {order.type || 'NORMAL'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-black text-monchito-purple uppercase tracking-tight whitespace-nowrap">{order.brandName}</TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-mono font-black text-slate-800 whitespace-nowrap">{formatCurrency(order.total)}</TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-mono font-black text-emerald-600 whitespace-nowrap">
                                            <div className="flex flex-col items-center">
                                                <span>{formatCurrency(initialPaid)}</span>
                                                {incomingDistributiveCredit > 0 && (
                                                    <span className="text-[9px] text-emerald-600 flex items-center justify-center gap-1">
                                                        <ArrowRight className="h-2 w-2" /> +{formatCurrency(incomingDistributiveCredit)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-bold text-slate-500 whitespace-nowrap">{formatDate(order.possibleDeliveryDate)}</TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-mono font-bold text-slate-600 whitespace-nowrap">{order.invoiceNumber || '-'}</TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-mono font-black text-slate-800 whitespace-nowrap">
                                            {order.realInvoiceTotal ? formatCurrency(order.realInvoiceTotal) : '-'}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center text-xs font-bold text-slate-700 whitespace-nowrap">{formatDate(order.receptionDate!)}</TableCell>
                                        
                                        <TableCell className={cn(
                                            "px-6 py-4 transition-all duration-300",
                                            isPinned('Saldo') && "sticky right-[320px] z-20 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.1)] border-l border-monchito-purple/5 bg-white group-hover:bg-slate-50 w-[160px] min-w-[160px] max-w-[160px]",
                                            !isPinned('Saldo') && "text-center"
                                        )}>
                                            <div className="flex items-center justify-center gap-2">
                                                {creditAmount > 0 ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black px-3 py-1 rounded-full whitespace-nowrap">
                                                        +{formatCurrency(creditAmount)}
                                                    </Badge>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 justify-center">
                                                        <span className={cn("font-black whitespace-nowrap", saldo > 0.01 ? 'text-red-500' : 'text-slate-400')}>
                                                            {formatCurrency(saldo)}
                                                        </span>
                                                        {saldo > 0.01 && <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className={cn(
                                            "px-6 py-4 transition-all duration-300",
                                            isPinned('Distribución') && "sticky right-[160px] z-20 border-l border-monchito-purple/5 bg-white group-hover:bg-slate-50 w-[160px] min-w-[160px] max-w-[160px]",
                                            !isPinned('Distribución') && "text-center"
                                        )}>
                                            {creditAmount > 0 ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!hasPermission('delivery.confirm')}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenCreditDistribution(order);
                                                    }}
                                                    className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-sm ${hasDistribution
                                                            ? 'bg-monchito-purple text-white border-monchito-purple hover:bg-monchito-purple/90'
                                                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
                                                        } ${!hasPermission('delivery.confirm') ? 'opacity-50' : ''}`}
                                                >
                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                    {hasDistribution ? 'Ver/Editar' : 'Distribuir'}
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Al día</span>
                                            )}
                                        </TableCell>

                                        <TableCell className={cn(
                                            "px-6 py-4 transition-all duration-300",
                                            isPinned('Acciones') && "sticky right-0 z-20 border-l border-monchito-purple/5 bg-white group-hover:bg-slate-50 w-[160px] min-w-[160px] max-w-[160px]",
                                            !isPinned('Acciones') && "text-center"
                                        )}>
                                            {hasPermission('delivery.dismantle') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDismantleModal({ isOpen: true, order });
                                                    }}
                                                    className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 active:scale-95 whitespace-nowrap"
                                                    title="Desmantelar Pedido"
                                                >
                                                    <Eraser className="h-4 w-4 mr-2" />
                                                    <span>Desmantelar</span>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {creditModalState.sourceOrder && (
                <CreditActionSelectorModal
                    isOpen={creditModalState.selectorOpen}
                    onClose={() => setCreditModalState({ selectorOpen: false, distributionOpen: false, creditAmount: 0, initialRemainingAction: undefined })}
                    sourceOrder={{
                        id: creditModalState.sourceOrder.id,
                        receiptNumber: creditModalState.sourceOrder.receiptNumber,
                        orderNumber: creditModalState.sourceOrder.orderNumber || '',
                        clientName: creditModalState.sourceOrder.clientName,
                        orderType: (creditModalState.sourceOrder.type || 'NORMAL') as any
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
                    initialDistribution={creditDistributions[creditModalState.sourceOrder.id]}
                    initialRemainingAction={creditModalState.initialRemainingAction}
                    onBack={handleBackToSelector}
                />
            )}

            {dismantleModal.order && (
                <DismantleModal
                    isOpen={dismantleModal.isOpen}
                    onClose={() => setDismantleModal({ isOpen: false, order: null })}
                    order={dismantleModal.order}
                    onSuccess={() => {
                        onSuccess?.();
                        setDismantleModal({ isOpen: false, order: null });
                    }}
                />
            )}
        </div>
    )
}
