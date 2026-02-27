import { OrderList } from "@/features/order-management"


export default function OrdersPage() {
    return (
        <>
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pedidos</h1>
            </div>
            <OrderList />
        </>
    )
}
