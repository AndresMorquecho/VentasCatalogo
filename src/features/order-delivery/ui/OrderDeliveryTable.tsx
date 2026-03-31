import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { AlertTriangle, DollarSign, ArrowRight } from "lucide-react"
import { Button } from "@/shared/ui/button"
import type { Order } from "@/entities/order/model/types"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { Badge } from "@/shared/ui/badge"
import { CreditActionSelectorModal } from "./CreditActionSelectorModal"
import { CreditDistributionModal } from "./CreditDistributionModal"
import { MoreHorizontal, Trash2, Info } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { DismantleModal } from "./DismantleModal"

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

    const calculateCreditAmount = (order: Order) => {
        const initialPaid = getPaidAmount(order);
        const finalTotal = Number(order.realInvoiceTotal ?? order.total ?? 0);
        const finalBalance = finalTotal - initialPaid;
        return finalBalance < -0.01 ? Math.abs(finalBalance) : 0;
    }

    const handleOpenCreditDistribution = (order: Order) => {
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
    }

    const handleMoveToWallet = () => {
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
        if (creditModalState.sourceOrder) {
            onUpdateCreditDistribution(creditModalState.sourceOrder.id, distribution);
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

    const getAvailableOrdersForDistribution = (sourceOrder: Order) => {
        return orders
            .filter(o => 
                o.id !== sourceOrder.id && 
                o.clientId === sourceOrder.clientId
            )
            .map(o => {
                const initialPaid = getPaidAmount(o);
                // Incoming from other distributions in current state
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
    }
    const handleToggleSelect = (order: Order) => {
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
    }

    const firstSelectedId = selectedOrderIds[0]
    const selectedClientId = firstSelectedId ? orders.find(o => o.id === firstSelectedId)?.clientId : null

    // Helper for toggle all
    const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Selecting all: if a client is already selected, pick all from that client. 
            // If the list is filtered by a clientId (main page filter), it's safe to select all.
            const targetClient = selectedClientId || (orders.length > 0 ? orders[0].clientId : null);
            if (!targetClient) return;
            
            const idsFromClient = orders
                .filter(o => o.clientId === targetClient)
                .map(o => o.id);
            onSelectionChange(idsFromClient);
        } else {
            onSelectionChange([]);
        }
    }

    const allFromClientSelected = orders.length > 0 && selectedClientId && 
        orders.filter(o => o.clientId === selectedClientId).every(o => selectedOrderIds.includes(o.id));

    return (
        <div className="rounded-2xl border border-monchito-purple/10 bg-white overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <Table className="border-collapse min-w-[2000px] w-full">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-b border-slate-200">
                            <TableHead className="w-[60px] text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">
                                <div className="flex flex-col items-center gap-1">
                                    <span>Selec.</span>
                                    <input 
                                        type="checkbox" 
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-monchito-purple"
                                        checked={!!allFromClientSelected}
                                        onChange={handleToggleAll}
                                        disabled={orders.length === 0}
                                    />
                                </div>
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Pedido por</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Recibo</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Empresaria</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">No de Pedido</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Tipo</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Catalogo</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Valor Pedido</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Abono</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Fecha Posible Entrega</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4 whitespace-nowrap">Factura / NC</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4 whitespace-nowrap">Valor Factura</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4 whitespace-nowrap">Fecha Ingreso</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4 whitespace-nowrap sticky right-[250px] bg-slate-50 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] border-l border-slate-200">Saldo</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4 whitespace-nowrap sticky right-[100px] bg-slate-50 z-20 border-l border-slate-200">Distribución</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4 whitespace-nowrap sticky right-0 bg-slate-50 z-20 border-l border-slate-200">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={14} className="h-24 text-center text-slate-400 font-medium italic">
                                    No hay pedidos listos para entrega.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const isSelected = selectedOrderIds.includes(order.id)
                                const isDisabled = selectedClientId !== null && order.clientId !== selectedClientId

                                const initialPaid = getPaidAmount(order)
                                const incomingDistributiveCredit = Object.entries(creditDistributions).reduce((sum, [, dist]) => {
                                    const distToThisOrder = dist.distributions.find(d => d.targetOrderId === order.id);
                                    return sum + (distToThisOrder?.amount || 0);
                                }, 0);

                                const totalAmount = order.realInvoiceTotal ?? order.total ?? 0
                                const saldo = Math.max(0, totalAmount - initialPaid - incomingDistributiveCredit)
                                const creditAmount = calculateCreditAmount(order)
                                const hasDistribution = !!creditDistributions[order.id]

                                return (
                                    <TableRow 
                                        key={order.id} 
                                        className={`group transition-colors hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-monchito-purple/5' : ''}`}
                                        onClick={() => !isDisabled && handleToggleSelect(order)}
                                    >
                                        <TableCell className="text-center py-3" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                onChange={() => handleToggleSelect(order)}
                                                className="h-4 w-4 rounded border-slate-300 text-monchito-purple"
                                            />
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-bold text-slate-600 uppercase whitespace-nowrap">{order.salesChannel || '-'}</TableCell>
                                        <TableCell className="text-center text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{order.receiptNumber}</TableCell>
                                        <TableCell className="text-center text-xs font-bold text-slate-900 whitespace-nowrap">{order.clientName}</TableCell>
                                        <TableCell className="text-center text-xs font-mono text-slate-600 whitespace-nowrap">{order.orderNumber || '-'}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase">
                                                {order.type || 'NORMAL'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-black text-monchito-purple uppercase tracking-tight whitespace-nowrap">{order.brandName}</TableCell>
                                        <TableCell className="text-center text-xs font-mono font-black text-slate-800 whitespace-nowrap">{formatCurrency(order.total)}</TableCell>
                                        <TableCell className="text-center text-xs font-mono font-black text-emerald-600 whitespace-nowrap">
                                            <div className="flex flex-col items-center">
                                                <span>{formatCurrency(initialPaid)}</span>
                                                {incomingDistributiveCredit > 0 && (
                                                    <span className="text-[9px] text-emerald-600 flex items-center justify-center gap-1">
                                                        <ArrowRight className="h-2 w-2" /> +{formatCurrency(incomingDistributiveCredit)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-bold text-slate-500 whitespace-nowrap">{formatDate(order.possibleDeliveryDate)}</TableCell>
                                        <TableCell className="text-center text-xs font-mono font-bold text-slate-600 whitespace-nowrap">{order.invoiceNumber || '-'}</TableCell>
                                        <TableCell className="text-center text-xs font-mono font-black text-slate-800 whitespace-nowrap">
                                            {order.realInvoiceTotal ? formatCurrency(order.realInvoiceTotal) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-bold text-slate-700 whitespace-nowrap">{formatDate(order.receptionDate!)}</TableCell>
                                        <TableCell className={`text-center text-xs font-mono font-black p-4 whitespace-nowrap sticky right-[250px] z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] border-l border-slate-100 ${isSelected ? 'bg-monchito-purple/5' : 'bg-white'} group-hover:bg-slate-50`}>
                                            <div className="flex items-center justify-center gap-2">
                                                {creditAmount > 0 ? (
                                                    <span className="text-emerald-600 font-black animate-pulse-subtle">
                                                        +{formatCurrency(creditAmount)}
                                                    </span>
                                                ) : (
                                                    <span className={saldo > 0.01 ? 'text-red-600' : 'text-slate-400'}>
                                                        {formatCurrency(saldo)}
                                                        {saldo > 0.01 && <AlertTriangle className="inline-block ml-1 h-3 w-3 text-red-500 animate-pulse" />}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className={`text-center p-4 sticky right-[100px] z-10 border-l border-slate-100 ${isSelected ? 'bg-monchito-purple/5' : 'bg-white'} group-hover:bg-slate-50`}>
                                            {creditAmount > 0 ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenCreditDistribution(order);
                                                    }}
                                                    className={`h-7 px-3 text-[10px] font-black uppercase tracking-tight flex items-center gap-2 transition-all ${
                                                        hasDistribution 
                                                            ? 'bg-monchito-purple text-white border-monchito-purple hover:bg-monchito-purple/90 shadow-md' 
                                                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <DollarSign className="h-3 w-3" />
                                                    {hasDistribution ? 'Ver/Editar' : 'Distribuir'}
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Al día</span>
                                            )}
                                        </TableCell>

                                        <TableCell className={`text-center p-4 sticky right-0 z-10 border-l border-slate-100 ${isSelected ? 'bg-monchito-purple/5' : 'bg-white'} group-hover:bg-slate-50`} onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-slate-200 shadow-xl">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opciones de Pedido</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer font-bold gap-2 py-2.5 rounded-lg"
                                                        onClick={() => setDismantleModal({ isOpen: true, order })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Desmantelar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-slate-600 font-bold gap-2 py-2.5 rounded-lg">
                                                        <Info className="h-4 w-4" /> Ver Detalles
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
