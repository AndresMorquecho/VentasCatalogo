import { useState, useMemo } from 'react'
import type { Order, OrderStatus } from '@/entities/order/model/types'

export type OrderFilterType = OrderStatus | 'ALL'

export function useOrderFilters(orders: Order[] = [], externalSearchQuery?: string) {
    const [statusFilter, setStatusFilter] = useState<OrderFilterType>('ALL')
    const [internalSearchQuery, setInternalSearchQuery] = useState('')

    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
    const setSearchQuery = externalSearchQuery !== undefined ? () => { } : setInternalSearchQuery

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // 1. Filter by status
            if (statusFilter !== 'ALL' && order.status !== statusFilter) {
                return false
            }

            // 2. Filter by search query (client, brand, receipt)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim()
                const matchesClient = order.clientName.toLowerCase().includes(query)
                const matchesBrand = order.brandName.toLowerCase().includes(query)
                const matchesReceipt = order.receiptNumber.toLowerCase().includes(query)

                if (!matchesClient && !matchesBrand && !matchesReceipt) {
                    return false
                }
            }

            return true
        })
    }, [orders, statusFilter, searchQuery])

    return {
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        filteredOrders
    }
}
