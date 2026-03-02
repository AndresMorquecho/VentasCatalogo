import { OrderList } from "@/features/order-management"
import { useState } from "react"

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="space-y-4">
            <OrderList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </div>
    )
}
