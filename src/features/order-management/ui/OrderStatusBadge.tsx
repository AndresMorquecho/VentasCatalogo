import type { OrderStatus } from "@/entities/order/model/types"

interface OrderStatusBadgeProps {
    status: OrderStatus
    className?: string
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    POR_RECIBIR: {
        label: "Por Recibir",
        className: "bg-amber-100 text-amber-800 border border-amber-300"
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

export function OrderStatusBadge({ status, className = "" }: OrderStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-50 text-gray-500" }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
            {config.label}
        </span>
    )
}
