import type { OrderStatus } from "@/entities/order/model/types"

interface OrderStatusBadgeProps {
    status: OrderStatus
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    RECIBIDO: {
        label: "Recibido",
        className: "bg-emerald-100 text-emerald-800 border border-emerald-300"
    },
    POR_RECIBIR: {
        label: "Por Recibir",
        className: "bg-amber-100 text-amber-800 border border-amber-300"
    },
    ATRASADO: {
        label: "Atrasado",
        className: "bg-red-100 text-red-700 border border-red-300"
    },
    CANCELADO: {
        label: "Cancelado",
        className: "bg-gray-100 text-gray-600 border border-gray-300"
    },
    RECIBIDO_EN_BODEGA: {
        label: "En Bodega",
        className: "bg-blue-100 text-blue-800 border border-blue-300"
    },
    ENTREGADO: {
        label: "Entregado",
        className: "bg-slate-100 text-slate-800 border border-slate-300"
    },
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-50 text-gray-500" }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    )
}
