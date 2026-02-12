import { OrderList } from "@/features/order-management"


export default function OrdersPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
            </div>
            <OrderList />
        </>
    )
}
