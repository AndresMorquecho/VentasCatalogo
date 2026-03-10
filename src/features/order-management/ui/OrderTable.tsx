import { Eye, Pencil, Trash2, RotateCcw, AlertCircle } from "lucide-react"
import { Button } from "@/shared/ui/button"
import type { Order, OrderStatus } from "@/entities/order/model/types"
import { getPaidAmount, getPendingAmount } from "@/entities/order/model/model"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { useAuth } from "@/shared/auth"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"

interface OrderTableProps {
    orders: Order[]
    onViewDetails: (order: Order) => void
    onEdit: (order: Order) => void
    onDelete: (order: Order) => void
    onReverse?: (order: Order) => void
    lastClosureDate?: Date | null
}

const ROW_STATUS_CLASSES: Record<OrderStatus, string> = {
    RECIBIDO: "bg-emerald-50/20 hover:bg-emerald-50/40",
    POR_RECIBIR: "bg-amber-50/20 hover:bg-amber-50/40",
    ATRASADO: "bg-red-50/20 hover:bg-red-50/40",
    CANCELADO: "bg-gray-50/20 hover:bg-gray-50/40",
    RECIBIDO_EN_BODEGA: "bg-blue-50/20 hover:bg-blue-50/40",
    ENTREGADO: "bg-slate-50/20 hover:bg-slate-50/40",
}

// Professional color palette for group accents
const ACCENT_COLORS = [
    "bg-indigo-600",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-violet-600",
    "bg-cyan-600",
    "bg-orange-600",
    "bg-fuchsia-600"
];

function getAccentColor(receiptNumber: string) {
    let hash = 0;
    for (let i = 0; i < receiptNumber.length; i++) {
        hash = receiptNumber.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % ACCENT_COLORS.length;
    return ACCENT_COLORS[index];
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

export function OrderTable({ orders, onViewDetails, onEdit, onDelete, onReverse, lastClosureDate }: OrderTableProps) {
    const { hasPermission } = useAuth()

    return (
        <TooltipProvider>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold whitespace-nowrap">
                                <th className="px-4 py-4 text-left w-[110px]">Origen</th>
                                <th className="px-4 py-4 text-left w-[140px]">N° Recibo</th>
                                <th className="px-4 py-4 text-left w-[120px]">N° Pedidos</th>
                                <th className="px-4 py-4 text-left w-[110px]">Tipo</th>
                                <th className="px-4 py-4 text-left min-w-[150px]">Cliente</th>
                                <th className="px-4 py-4 text-left min-w-[120px]">Marca</th>
                                <th className="px-4 py-4 text-right w-[90px]">Total</th>
                                <th className="px-4 py-4 text-right w-[90px]">Abono</th>
                                <th className="px-4 py-4 text-right w-[90px]">Saldo</th>
                                <th className="px-4 py-4 text-left w-[110px]">F. Entrega</th>
                                <th className="px-4 py-4 text-left w-[130px]">Estado</th>
                                <th className="px-4 py-4 text-center w-[100px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order) => {
                                const showReverse = order.status === 'RECIBIDO_EN_BODEGA' && !order.deliveryDate;
                                const accentColor = getAccentColor(order.receiptNumber);

                                // BUSINESS RULE: Cannot edit if any movement happened
                                // Movement: Status != POR_RECIBIR OR has more than 1 payment
                                const hasMovement = order.status !== 'POR_RECIBIR' || (order.payments && order.payments.length > 1);

                                // Period check: Cannot edit if date is closed
                                const isClosed = lastClosureDate && order.transactionDate && new Date(order.transactionDate) <= lastClosureDate;

                                const canEdit = !hasMovement && !isClosed;

                                let blockReason = "";
                                if (order.status === 'ENTREGADO') blockReason = "Pedido ya entregado";
                                else if (order.status !== 'POR_RECIBIR') blockReason = "Pedido ya procesado";
                                else if (order.payments && order.payments.length > 1) blockReason = "Tiene abonos adicionales";
                                else if (isClosed) blockReason = "Periodo de caja cerrado";

                                return (
                                    <tr
                                        key={order.id}
                                        className={`transition-all duration-200 ${ROW_STATUS_CLASSES[order.status as OrderStatus] || "hover:bg-slate-50"} relative group`}
                                    >
                                        <td className="px-4 py-2.5 relative">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight shadow-sm ${order.salesChannel === 'WHATSAPP' ? 'bg-green-100 text-green-700' :
                                                order.salesChannel === 'DOMICILIO' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {order.salesChannel}
                                            </span>
                                        </td>

                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${accentColor} shadow-sm`} />
                                                <span className="text-sm tracking-tight text-slate-900 font-extrabold">
                                                    {order.receiptNumber}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-2.5 text-xs font-mono font-bold text-slate-600 bg-slate-50/10">
                                            {order.childOrdersCount && order.childOrdersCount > 0
                                                ? <span className="text-monchito-purple bg-purple-50 px-2 py-1 rounded-md border border-purple-100 italic whitespace-nowrap">{order.childOrdersCount + 1} pedidos</span>
                                                : (order.orderNumber || '---')}
                                        </td>

                                        <td className="px-4 py-2.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${order.type === 'REPROGRAMACION' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                {order.type}
                                            </span>
                                        </td>

                                        <td className="px-4 py-2.5 font-semibold text-slate-700 truncate max-w-[200px] whitespace-nowrap">{order.clientName}</td>

                                        <td className="px-4 py-2.5">
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

                                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                            {(() => {
                                                const total = (order.childOrders || []).reduce((sum, child) => sum + Number(child.total || 0), Number(order.total || 0));
                                                return formatCurrency(total);
                                            })()}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">
                                            {(() => {
                                                const paid = (order.childOrders || []).reduce((sum, child) => sum + getPaidAmount(child), getPaidAmount(order));
                                                return formatCurrency(paid);
                                            })()}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-black text-rose-600">
                                            {(() => {
                                                const pending = (order.childOrders || []).reduce((sum, child) => sum + getPendingAmount(child), getPendingAmount(order));
                                                return formatCurrency(pending);
                                            })()}
                                        </td>

                                        <td className="px-4 py-2.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                                            {order.possibleDeliveryDate ? formatDate(order.possibleDeliveryDate) : '---'}
                                        </td>

                                        <td className="px-4 py-2.5">
                                            <OrderStatusBadge status={order.status as OrderStatus} />
                                        </td>

                                        <td className="px-4 py-2.5">
                                            <div className="flex justify-center items-center gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    onClick={() => onViewDetails(order)}
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {showReverse ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                                        onClick={() => onReverse?.(order)}
                                                        title="Regresar recepción"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    hasPermission('orders.edit') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-8 w-8 text-slate-900 hover:bg-slate-100 font-bold ${!canEdit ? 'opacity-40' : ''}`}
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                onEdit(order)
                                                            }}
                                                            title="Editar recibo completo"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )
                                                )}

                                                {hasPermission('orders.delete') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors ${!canEdit ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            onDelete(order)
                                                        }}
                                                        title="Anular Pedido"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {!canEdit && (
                                                    <div title="Este pedido ya tiene movimientos y no puede ser modificado">
                                                        <AlertCircle className="h-3.5 w-3.5 text-amber-400 opacity-50 ml-1" />
                                                    </div>
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
