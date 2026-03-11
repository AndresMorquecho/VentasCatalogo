import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog"
import { OrderStatusBadge } from "./OrderStatusBadge"
import type { Order, OrderStatus } from "@/entities/order/model/types"
import { getPaidAmount, getEffectiveTotal, getPendingAmount } from "@/entities/order/model/model"
import { ListOrdered } from "lucide-react"
import { useClient } from "@/features/clients/api/hooks"

interface OrderDetailModalProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

export function OrderDetailModal({ order, open, onOpenChange }: OrderDetailModalProps) {
    const { data: client } = useClient(order?.clientId || "")

    if (!order) return null

    const paidAmount = getPaidAmount(order);
    const effectiveTotal = getEffectiveTotal(order);
    const rawPendingAmount = effectiveTotal - paidAmount;

    // clamp it for regular view:
    const pendingAmount = Math.max(0, rawPendingAmount);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader className="mb-0 pb-2 border-b">
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <p className="text-[10px] font-black uppercase text-monchito-purple tracking-widest mb-1">Registro de Ventas</p>
                            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Recibo {order.receiptNumber}</DialogTitle>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <OrderStatusBadge status={order.status} className="scale-110 shadow-sm" />
                            <p className="text-[10px] text-muted-foreground font-medium italic">Canal: {order.salesChannel}</p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Global Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente</p>
                        <p className="font-bold text-slate-700 truncate">{order.clientName}</p>
                        <p className="text-[10px] text-slate-500 mt-1">C.I. {client?.identificationNumber || 'S/N'}</p>
                    </div>

                    <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-monchito-purple uppercase mb-1">Estado de Pagos</p>
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-500">Abonado:</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-500">Pendiente:</span>
                            <span className="font-bold text-rose-600">{formatCurrency(pendingAmount)}</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha de Creación</p>
                        <p className="font-bold text-slate-700">{formatDate(order.createdAt)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gestionado por</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full bg-monchito-purple text-white flex items-center justify-center text-[10px] font-bold">
                                {(order.createdByName || 'U').charAt(0)}
                            </div>
                            <p className="font-bold text-slate-700 text-sm truncate">{order.createdByName || 'S/N'}</p>
                        </div>
                    </div>
                </div>

                {/* Associated Orders Table */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end mb-2 border-b pb-2">
                        <div className="flex items-center gap-2">
                            <ListOrdered className="w-5 h-5 text-monchito-purple" />
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Desglose de Pedidos Asociados</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Total del Recibo</p>
                            <p className="text-2xl font-black text-monchito-purple leading-none">{formatCurrency(effectiveTotal)}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-md">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                                        <th className="px-5 py-4">N° Pedido</th>
                                        <th className="px-5 py-4">Catalogo</th>
                                        <th className="px-5 py-4 text-right">Total</th>
                                        <th className="px-5 py-4 text-right">Abono</th>
                                        <th className="px-5 py-4 text-right">Saldo</th>
                                        <th className="px-5 py-4 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {/* Parent Order */}
                                    <tr className="bg-purple-50/40 font-medium border-l-4 border-l-monchito-purple">
                                        <td className="px-5 py-4 font-black text-slate-900">{order.orderNumber || 'Principal'}</td>
                                        <td className="px-5 py-4">{order.brandName}</td>
                                        <td className="px-5 py-4 text-right font-black text-slate-900">{formatCurrency(Number(order.total))}</td>
                                        <td className="px-5 py-4 text-right text-emerald-600 font-bold">{formatCurrency(getPaidAmount(order))}</td>
                                        <td className="px-5 py-4 text-right text-rose-600 font-bold">{formatCurrency(getPendingAmount(order))}</td>
                                        <td className="px-5 py-4 text-center">
                                            <OrderStatusBadge status={order.status as OrderStatus} />
                                        </td>
                                    </tr>
                                    {/* Child Orders */}
                                    {order.childOrders && order.childOrders.length > 0 && order.childOrders.map((child) => (
                                        <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-700">{child.orderNumber || 'S/N'}</td>
                                            <td className="px-5 py-4">{child.brandName}</td>
                                            <td className="px-5 py-4 text-right font-medium text-slate-900">{formatCurrency(Number(child.total))}</td>
                                            <td className="px-5 py-4 text-right text-emerald-600">{formatCurrency(getPaidAmount(child))}</td>
                                            <td className="px-5 py-4 text-right text-rose-600 font-bold">{formatCurrency(getPendingAmount(child))}</td>
                                            <td className="px-5 py-4 text-center">
                                                <OrderStatusBadge status={child.status as OrderStatus} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {(!order.childOrders || order.childOrders.length === 0) && (
                        <div className="flex items-center justify-center py-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Registro Individual - Sin pedidos asociados</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
