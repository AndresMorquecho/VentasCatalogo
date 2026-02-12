import { useState } from "react"
import { Skeleton } from "@/shared/ui/skeleton"
import { Button } from "@/shared/ui/button"
import { Plus } from "lucide-react"
import { useOrderList } from "@/entities/order/model/hooks"
import { useOrderFilters } from "../model/useOrderFilters"
import { OrderFilters } from "./OrderFilters"
import { OrderTable } from "./OrderTable"
import { OrderDetailModal } from "./OrderDetailModal"
import { OrderFormModal } from "./OrderFormModal"
import type { Order } from "@/entities/order/model/types"

export function OrderList() {
    const { data: orders = [], isLoading } = useOrderList()
    const {
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        filteredOrders
    } = useOrderFilters(orders)

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [modalMode, setModalMode] = useState<'none' | 'detail' | 'create' | 'edit'>('none')

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order)
        setModalMode('detail')
    }

    const handleEdit = (order: Order) => {
        setSelectedOrder(order)
        setModalMode('edit')
    }

    const handleCreate = () => {
        setSelectedOrder(null)
        setModalMode('create')
    }

    const handleClose = () => {
        setModalMode('none')
        setSelectedOrder(null)
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full md:w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <OrderFilters
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
                </Button>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
                    <p>No se encontraron pedidos con estos criterios.</p>
                </div>
            ) : (
                <OrderTable
                    orders={filteredOrders}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                />
            )}

            <OrderDetailModal
                order={selectedOrder}
                open={modalMode === 'detail'}
                onOpenChange={(open) => !open && handleClose()}
            />

            <OrderFormModal
                order={modalMode === 'edit' ? selectedOrder : null}
                open={modalMode === 'create' || modalMode === 'edit'}
                onOpenChange={(open) => !open && handleClose()}
            />
        </div>
    )
}
