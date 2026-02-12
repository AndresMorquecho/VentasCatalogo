import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../shared/ui/card"
import type { Order } from "@/entities/order/model/types"
import { OrderStatusBadge } from "./OrderStatusBadge"

interface OrderCardProps {
    order: Order
}

export function OrderCard({ order }: OrderCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-sm font-medium">#{order.id}</CardTitle>
                    <CardDescription>{new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                </div>
                <OrderStatusBadge status={order.status} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${order.total.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                    {order.items.length} artículos
                </p>
            </CardContent>
        </Card>
    )
}
