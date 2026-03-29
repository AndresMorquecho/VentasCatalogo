import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { AlertTriangle } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { Badge } from "@/shared/ui/badge"

interface OrderDeliveryTableProps {
    orders: Order[]
    selectedOrderIds: string[]
    onSelectionChange: (ids: string[]) => void
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
    onSelectionChange 
}: OrderDeliveryTableProps) {
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
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Factura / NC</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Valor Factura</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Fecha Ingreso</TableHead>
                            <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-4">Saldo</TableHead>
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

                                const paidAmount = getPaidAmount(order)
                                const totalAmount = order.realInvoiceTotal || order.total || 0
                                const saldo = Math.max(0, totalAmount - paidAmount)

                                return (
                                    <TableRow 
                                        key={order.id} 
                                        className={`transition-colors hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-monchito-purple/5' : ''}`}
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
                                        <TableCell className="text-center text-xs font-mono font-black text-emerald-600 whitespace-nowrap">{formatCurrency(paidAmount)}</TableCell>
                                        <TableCell className="text-center text-xs font-bold text-slate-500 whitespace-nowrap">{formatDate(order.possibleDeliveryDate)}</TableCell>
                                        <TableCell className="text-center text-xs font-mono font-bold text-slate-600 whitespace-nowrap">{order.invoiceNumber || '-'}</TableCell>
                                        <TableCell className="text-center text-xs font-mono font-black text-slate-800 whitespace-nowrap">
                                            {order.realInvoiceTotal ? formatCurrency(order.realInvoiceTotal) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-bold text-slate-700 whitespace-nowrap">{formatDate(order.receptionDate!)}</TableCell>
                                        <TableCell className={`text-center text-xs font-mono font-black p-4 whitespace-nowrap ${saldo > 0.01 ? 'text-red-600' : 'text-slate-400'}`}>
                                            {formatCurrency(saldo)}
                                            {saldo > 0.01 && <AlertTriangle className="inline-block ml-1 h-3 w-3 text-red-500 animate-pulse" />}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
