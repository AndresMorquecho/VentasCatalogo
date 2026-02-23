import { useState } from "react"
import { Skeleton } from "@/shared/ui/skeleton"
import { Button } from "@/shared/ui/button"
import { Plus } from "lucide-react"
import { useOrderList, useDeleteOrder } from "@/entities/order/model/hooks"
import { useOrderFilters } from "../model/useOrderFilters"
import { OrderFilters } from "./OrderFilters"
import { OrderTable } from "./OrderTable"
import { OrderDetailModal } from "./OrderDetailModal"
import { OrderFormModal } from "./OrderFormModal"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { useToast } from "@/shared/ui/use-toast"
import { getPaidAmount, getPendingAmount } from "@/entities/order/model/model"
import type { Order } from "@/entities/order/model/types"

export function OrderList() {
    const { data: orders = [], isLoading } = useOrderList()
    const deleteOrder = useDeleteOrder()
    const { showToast } = useToast()
    const {
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        filteredOrders
    } = useOrderFilters(orders)

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [modalMode, setModalMode] = useState<'none' | 'detail' | 'create' | 'edit' | 'delete'>('none')

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order)
        setModalMode('detail')
    }

    const handleEdit = (order: Order) => {
        setSelectedOrder(order)
        setModalMode('edit')
    }

    const handleDeleteClick = (order: Order) => {
        setSelectedOrder(order)
        setModalMode('delete')
    }

    const handleConfirmDelete = async () => {
        if (!selectedOrder) return

        try {
            await deleteOrder.mutateAsync(selectedOrder.id)
            showToast(`Pedido ${selectedOrder.receiptNumber} eliminado correctamente`, 'success')
            setModalMode('none')
            setSelectedOrder(null)
        } catch (error) {
            showToast('Error al eliminar el pedido', 'error')
        }
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
                    onDelete={handleDeleteClick}
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

            {selectedOrder && (
                <ConfirmDialog
                    open={modalMode === 'delete'}
                    onOpenChange={(open) => !open && handleClose()}
                    onConfirm={handleConfirmDelete}
                    title="Eliminar Pedido"
                    description={`¿Estás seguro de eliminar el pedido ${selectedOrder.receiptNumber}?`}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    variant="destructive"
                >
                    <div className="space-y-3 text-sm">
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                            <p className="font-medium text-amber-900 mb-2">⚠️ Esta acción afectará:</p>
                            <ul className="space-y-1 text-amber-800">
                                <li>• El pedido será marcado como <strong>CANCELADO</strong></li>
                                {getPaidAmount(selectedOrder) > 0 && (
                                    <li>• Abono realizado: <strong>${getPaidAmount(selectedOrder).toFixed(2)}</strong> (se mantendrá registrado)</li>
                                )}
                                {getPendingAmount(selectedOrder) > 0 && (
                                    <li>• Saldo pendiente: <strong>${getPendingAmount(selectedOrder).toFixed(2)}</strong> (se cancelará)</li>
                                )}
                                <li>• Los registros financieros asociados se mantendrán</li>
                                <li>• Esta acción NO se puede deshacer</li>
                            </ul>
                        </div>
                        
                        <div className="text-muted-foreground">
                            <p><strong>Cliente:</strong> {selectedOrder.clientName}</p>
                            <p><strong>Marca:</strong> {selectedOrder.brandName}</p>
                            <p><strong>Total:</strong> ${selectedOrder.total.toFixed(2)}</p>
                        </div>
                    </div>
                </ConfirmDialog>
            )}
        </div>
    )
}
