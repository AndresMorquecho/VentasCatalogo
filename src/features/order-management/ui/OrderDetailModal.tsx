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

    const allOrders = [order, ...(order.childOrders || [])];
    const totalPaidAmount = allOrders.reduce((sum, o) => sum + getPaidAmount(o), 0);
    const totalEffectiveTotal = allOrders.reduce((sum, o) => sum + getEffectiveTotal(o), 0);
    const totalPendingAmount = Math.max(0, totalEffectiveTotal - totalPaidAmount);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-0 border-none rounded-3xl shadow-2xl">
                <div className="p-6 md:p-8 space-y-6">
                    <DialogHeader className="mb-0 pb-4 border-b border-slate-100">
                        <div className="flex items-center justify-between pr-8">
                            <div>
                                <p className="text-[10px] font-black uppercase text-monchito-purple tracking-widest mb-1">Registro de Ventas</p>
                                <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                                    {(() => {
                                        const receipt = order.receiptNumber || "";
                                        if (receipt.startsWith('S/N-') || receipt.startsWith('SN-')) return "Recibo SIN GUÍA";
                                        return `Recibo ${receipt}`;
                                    })()}
                                </DialogTitle>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <OrderStatusBadge status={order.status} className="scale-110 shadow-sm" />
                                <p className="text-[10px] text-muted-foreground font-medium italic">Canal: {order.salesChannel}</p>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Global Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente</p>
                            <p className="font-bold text-slate-700 truncate">{order.clientName}</p>
                            <p className="text-[10px] text-slate-500 mt-1">C.I. {client?.identificationNumber || 'S/N'}</p>
                        </div>

                        <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-monchito-purple uppercase mb-1">Resumen del Recibo</p>
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Pedido:</span>
                                <span className="font-black text-slate-800">{formatCurrency(allOrders.reduce((sum, o) => sum + Number(o.total || 0), 0))}</span>
                            </div>
                            {allOrders.some(o => o.realInvoiceTotal) && (
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Factura:</span>
                                    <span className="font-black text-indigo-600">{formatCurrency(totalEffectiveTotal)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Abonado:</span>
                                <span className="font-black text-emerald-600">{formatCurrency(totalPaidAmount)}</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1 border-t border-purple-100 mt-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Saldo:</span>
                                <span className="font-black text-rose-600">{formatCurrency(totalPendingAmount)}</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha de Registro</p>
                            <p className="font-bold text-slate-700">{formatDate(order.createdAt)}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
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
                        <div className="flex justify-between items-end mb-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <ListOrdered className="w-5 h-5 text-monchito-purple" />
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Desglose de Pedidos Asociados</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1 text-slate-400">Total Recibido</p>
                                <p className="text-2xl font-black text-monchito-purple leading-none">{formatCurrency(totalPaidAmount)}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px] text-left border-collapse">                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-200 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                                            <th className="px-5 py-4 w-12 text-center border-r border-slate-100">N°</th>
                                            <th className="px-5 py-4 min-w-[150px] border-r border-slate-100">Empresaria</th>
                                            <th className="px-5 py-4 border-r border-slate-100">N° Pedido</th>
                                            <th className="px-5 py-4 border-r border-slate-100">Tipo</th>
                                            <th className="px-5 py-4 border-r border-slate-100">Catalogo</th>
                                            <th className="px-5 py-4 text-right border-r border-slate-100">V. Pedido</th>
                                            <th className="px-5 py-4 text-right border-r border-slate-100">V. Factura</th>
                                            <th className="px-5 py-4 text-right border-r border-slate-100">Abono</th>
                                            <th className="px-5 py-4 text-right border-r border-slate-100">Saldo</th>
                                            <th className="px-5 py-4 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* Parent Order */}
                                        <tr className="bg-purple-50/30 font-medium hover:bg-purple-50/50 transition-colors">
                                            <td className="px-5 py-4 text-center font-bold text-slate-300 border-r border-purple-100/50">1</td>
                                            <td className="px-5 py-4 border-r border-purple-100/50">
                                                <span className="font-bold text-slate-700 block truncate max-w-[180px]" title={order.clientName}>
                                                    {order.clientName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-black text-monchito-purple border-r border-purple-100/50">{order.orderNumber || 'Principal'}</td>
                                            <td className="px-5 py-4 border-r border-purple-100/50">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                                    order.type === 'NORMAL' ? 'bg-emerald-100 text-emerald-700' :
                                                    order.type === 'CAMBIO' ? 'bg-purple-100 text-purple-700' :
                                                    order.type === 'REPROGRAMACION' ? 'bg-blue-100 text-blue-700' :
                                                    order.type === 'PREVENTA' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {order.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 border-r border-purple-100/50 font-bold uppercase text-slate-500">{order.brandName}</td>
                                            <td className="px-5 py-4 text-right font-black text-slate-500 border-r border-purple-100/50">{formatCurrency(Number(order.total))}</td>
                                            <td className="px-5 py-4 text-right font-black text-slate-900 border-r border-purple-100/50">{order.realInvoiceTotal ? formatCurrency(Number(order.realInvoiceTotal)) : '-'}</td>
                                            <td className="px-5 py-4 text-right text-emerald-600 font-black border-r border-purple-100/50">{formatCurrency(getPaidAmount(order))}</td>
                                            <td className="px-5 py-4 text-right text-rose-600 font-black border-r border-purple-100/50">{formatCurrency(getPendingAmount(order))}</td>
                                            <td className="px-5 py-4 text-center">
                                                <OrderStatusBadge status={order.status as OrderStatus} />
                                            </td>
                                        </tr>
                                        {/* Child Orders */}
                                        {order.childOrders && order.childOrders.length > 0 && order.childOrders.map((child, idx) => (
                                            <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-4 text-center font-bold text-slate-300 border-r border-slate-100">{idx + 2}</td>
                                                <td className="px-5 py-4 border-r border-slate-100">
                                                    <span className="font-bold text-slate-700 block truncate max-w-[180px]" title={child.clientName || order.clientName}>
                                                        {child.clientName || order.clientName}
                                                     </span>
                                                </td>
                                                <td className="px-5 py-4 font-bold text-slate-600 border-r border-slate-100">{child.orderNumber || 'S/N'}</td>
                                                <td className="px-5 py-4 border-r border-slate-100">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                                        child.type === 'NORMAL' ? 'bg-emerald-100 text-emerald-700' :
                                                        child.type === 'CAMBIO' ? 'bg-purple-100 text-purple-700' :
                                                        child.type === 'REPROGRAMACION' ? 'bg-blue-100 text-blue-700' :
                                                        child.type === 'PREVENTA' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {child.type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 uppercase text-slate-500 font-medium">{child.brandName}</td>
                                                <td className="px-5 py-4 text-right font-bold text-slate-500 border-r border-slate-100">{formatCurrency(Number(child.total))}</td>
                                                <td className="px-5 py-4 text-right font-bold text-slate-700 border-r border-slate-100">{child.realInvoiceTotal ? formatCurrency(Number(child.realInvoiceTotal)) : '-'}</td>
                                                <td className="px-5 py-4 text-right text-emerald-600 font-bold border-r border-slate-100">{formatCurrency(getPaidAmount(child))}</td>
                                                <td className="px-5 py-4 text-right text-rose-600 font-bold border-r border-slate-100">{formatCurrency(getPendingAmount(child))}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <OrderStatusBadge status={child.status as OrderStatus} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Observations / Notes Section */}
                        {order.notes && (
                            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 mt-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                                    Observaciones del Pedido
                                </p>
                                <div className="text-xs text-slate-600 leading-relaxed font-medium bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
                                    {order.notes}
                                </div>
                            </div>
                        )}

                        {(!order.childOrders || order.childOrders.length === 0) && (
                            <div className="flex items-center justify-center py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Registro Individual - Sin otros pedidos en este recibo</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
