import { OrderList } from "@/features/order-management"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Inbox } from "lucide-react"

export default function OrdersPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Pedidos" 
                description="Listado de pedidos"
                icon={Inbox}
            />
            <OrderList />
        </div>
    )
}
