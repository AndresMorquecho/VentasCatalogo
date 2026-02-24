import { OrderList } from "@/features/order-management"


export default function OrdersPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pedidos</h2>
            </div>
            <OrderList />
        </>
    )
}
