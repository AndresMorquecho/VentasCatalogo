import { OrderList } from "@/features/order-management"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Inbox, Plus } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useState } from "react"

export default function OrdersPage() {
    const [triggerCreate, setTriggerCreate] = useState(false)

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Pedidos" 
                description="Listado de pedidos"
                icon={Inbox}
                actions={
                    <Button onClick={() => setTriggerCreate(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
                    </Button>
                }
            />
            <OrderList triggerCreate={triggerCreate} onTriggerHandled={() => setTriggerCreate(false)} />
        </div>
    )
}
