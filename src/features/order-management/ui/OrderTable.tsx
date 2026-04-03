import { Eye, Pencil, Trash2, Receipt, User, Edit2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import type { Order, OrderStatus } from "@/entities/order/model/types"
import { getPaidAmount, getPendingAmount } from "@/entities/order/model/model"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { useAuth } from "@/shared/auth"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { useIsMobile } from "@/shared/hooks/use-mobile"

interface OrderTableProps {
    orders: Order[]
    onViewDetails: (order: Order) => void
    onEdit: (order: Order) => void
    onDelete: (client: Order) => void
    lastClosureDate?: Date | null
}

const ROW_STATUS_CLASSES: Record<OrderStatus, string> = {
    POR_ENVIAR: "bg-indigo-50/20 hover:bg-indigo-50/40",
    EN_TRANSITO: "bg-cyan-50/20 hover:bg-cyan-50/40",
    POR_RECIBIR: "bg-amber-50/20 hover:bg-amber-50/40",
    RECIBIDO_EN_BODEGA: "bg-blue-50/20 hover:bg-blue-50/40",
    ENTREGADO: "bg-slate-50/20 hover:bg-slate-50/40",
    ANULADO: "bg-slate-50/10 opacity-60",
    DESMANTELADO: "bg-red-50/10 hover:bg-red-50/20",
    CAMBIADO: "bg-purple-50/20 hover:bg-purple-50/40",
    RECOLECTADO: "bg-emerald-50/20 hover:bg-emerald-50/40",
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

const formatReceipt = (receipt: string) => {
    if (!receipt) return '-';
    if (receipt.startsWith('S/N-') || receipt.startsWith('SN-')) return '-';
    return receipt;
};

export function OrderTable({ orders, onViewDetails, onEdit, onDelete, lastClosureDate }: OrderTableProps) {
    const { hasPermission } = useAuth()
    const isMobile = useIsMobile()

    if (isMobile) {
        return (
            <div className="space-y-4">
                {orders.map((order) => {
                    const total = (order.childOrders || []).reduce((sum, child) => sum + Number(child.total || 0), Number(order.total || 0));
                    const pending = (order.childOrders || []).reduce((sum, child) => sum + getPendingAmount(child), getPendingAmount(order));
                    
                    const paymentCount = order.payments?.length || 0;
                    const hasRealMovement = order.status !== 'POR_RECIBIR' || paymentCount > 2 || (paymentCount > 1 && !order.payments?.some(p => p.method === 'CREDITO_CLIENTE'));
                    const isClosed = lastClosureDate && order.transactionDate && new Date(order.transactionDate) <= lastClosureDate;
                    const canEditReceipt = !isClosed;
                    const canDeleteReceipt = !hasRealMovement && !isClosed;

                    return (
                        <div key={order.id} className="bg-white rounded-2xl border border-monchito-purple/10 shadow-sm p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-3.5 w-3.5 text-monchito-purple" />
                                        <span className="font-black text-slate-900">{formatReceipt(order.receiptNumber)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-600 truncate max-w-[200px]">{order.clientName}</span>
                                    </div>
                                </div>
                                <OrderStatusBadge status={order.status as OrderStatus} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                    <p className="text-sm font-black text-slate-900">{formatCurrency(total)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo</p>
                                    <p className="text-sm font-black text-rose-600">{formatCurrency(pending)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega</span>
                                        <span className="text-xs font-bold text-slate-600">
                                            {order.possibleDeliveryDate ? formatDate(order.possibleDeliveryDate) : '---'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl border-slate-100"
                                        onClick={() => onViewDetails(order)}
                                    >
                                        <Eye className="h-4 w-4 text-indigo-600" />
                                    </Button>
                                    {hasPermission('orders.edit') && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className={`h-9 w-9 rounded-xl border-slate-100 ${!canEditReceipt ? 'opacity-40' : ''}`}
                                            onClick={() => canEditReceipt && onEdit(order)}
                                        >
                                            <Pencil className="h-4 w-4 text-slate-700" />
                                        </Button>
                                    )}
                                    {hasPermission('orders.delete') && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className={`h-9 w-9 rounded-xl border-slate-100 ${!canDeleteReceipt ? 'opacity-40' : ''}`}
                                            onClick={() => canDeleteReceipt && onDelete(order)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="rounded-2xl border border-monchito-purple/10 bg-white shadow-[0_20px_50px_rgba(107,33,168,0.05)] overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="text-sm border-collapse min-w-[1200px] w-full">
                        <thead className="sticky top-0 z-10 bg-monchito-purple/5 backdrop-blur-sm">
                            <tr className="border-b border-monchito-purple/10">
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest h-12 text-left w-[80px]">Origen</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left w-[160px]">N° Recibo</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left w-[90px]">N° Ped.</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left min-w-[160px]">Cliente</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left min-w-[80px]">Cat.</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right w-[75px]">Total</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right w-[75px]">Abono</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right w-[75px]">Saldo</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left w-[80px]">Entrega</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left w-[100px]">Estado</th>
                                <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center w-[80px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-monchito-purple/5">
                            {orders.map((order) => {


                                // Movement check: Used for delete and visual warnings
                                // We allow up to 2 payments if one is credit, as that's standard for initial movements
                                const paymentCount = order.payments?.length || 0;
                                const hasRealMovement = order.status !== 'POR_RECIBIR' || paymentCount > 2 || (paymentCount > 1 && !order.payments?.some(p => p.method === 'CREDITO_CLIENTE'));

                                // Period check: Cannot edit if date is closed
                                const isClosed = lastClosureDate && order.transactionDate && new Date(order.transactionDate) <= lastClosureDate;

                                // For the receipt level edit button, we only block if period is closed
                                const canEditReceipt = !isClosed;
                                const canDeleteReceipt = !hasRealMovement && !isClosed;



                                return (
                                    <tr
                                        key={order.id}
                                        className={`transition-all duration-200 ${ROW_STATUS_CLASSES[order.status as OrderStatus] || "hover:bg-monchito-purple/5"} relative group whitespace-nowrap`}
                                    >
                                        <td className="px-6 py-4 relative">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight shadow-sm ${order.salesChannel === 'WHATSAPP' ? 'bg-green-100 text-green-700' :
                                                order.salesChannel === 'DOMICILIO' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {order.salesChannel}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-sm tracking-tight text-slate-700 font-medium">
                                                {formatReceipt(order.receiptNumber)}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-600 bg-slate-50/10">
                                            {order.childOrdersCount && order.childOrdersCount > 0
                                                ? <span className="text-monchito-purple bg-purple-50 px-2 py-1 rounded-md border border-purple-100 italic whitespace-nowrap">{order.childOrdersCount + 1} pedidos</span>
                                                : (order.orderNumber || '---')}
                                        </td>



                                        <td className="px-6 py-4 font-semibold text-slate-700 truncate max-w-[200px]">{order.clientName}</td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const brands = new Set<string>();
                                                    if (order.brandName) brands.add(order.brandName);
                                                    order.childOrders?.forEach(child => {
                                                        if (child.brandName) brands.add(child.brandName);
                                                    });
                                                    const brandsArray = Array.from(brands);
                                                    if (brandsArray.length === 0) return <span className="text-slate-400 font-medium">Sin marca</span>;
                                                    return (
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-600 font-medium">{brandsArray[0]}</span>
                                                            {brandsArray.length > 1 && (
                                                                <span className="text-[10px] text-monchito-purple font-bold">
                                                                    + {brandsArray.length - 1} marca{brandsArray.length > 2 ? 's' : ''} adicional{brandsArray.length > 2 ? 'es' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            {(() => {
                                                const total = (order.childOrders || []).reduce((sum, child) => sum + Number(child.total || 0), Number(order.total || 0));
                                                return formatCurrency(total);
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                                            {(() => {
                                                const paid = (order.childOrders || []).reduce((sum, child) => sum + getPaidAmount(child), getPaidAmount(order));
                                                return formatCurrency(paid);
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-rose-600">
                                            {(() => {
                                                const pending = (order.childOrders || []).reduce((sum, child) => sum + getPendingAmount(child), getPendingAmount(order));
                                                return formatCurrency(pending);
                                            })()}
                                        </td>

                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                            {order.possibleDeliveryDate ? formatDate(order.possibleDeliveryDate) : '---'}
                                        </td>

                                        <td className="px-6 py-4">
                                            <OrderStatusBadge status={order.status as OrderStatus} />
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    onClick={() => onViewDetails(order)}
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {hasPermission('orders.edit') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-900 hover:bg-slate-100 font-bold"
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            onEdit(order)
                                                        }}
                                                        disabled={!canEditReceipt}
                                                        title={!canEditReceipt ? "No se puede editar: Periodo de caja cerrado" : "Editar recibo completo"}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {hasPermission('orders.delete') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            onDelete(order)
                                                        }}
                                                        disabled={!canDeleteReceipt}
                                                        title={!canDeleteReceipt ? "No se puede eliminar: Periodo cerrado o con abonos reales" : "Eliminar recibo completo"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </TooltipProvider>
    )
}
