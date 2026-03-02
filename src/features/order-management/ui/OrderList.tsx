import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Plus, ShoppingBag, Search, LayoutDashboard, Package, Clock, XCircle } from "lucide-react"
import { useOrderList, useDeleteOrder } from "@/entities/order/model/hooks"
import { useOrderFilters } from "../model/useOrderFilters"
import { OrderTable } from "./OrderTable"
import { OrderDetailModal } from "./OrderDetailModal"
import { OrderFormModal } from "./OrderFormModal"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { useToast } from "@/shared/ui/use-toast"
import { getPaidAmount } from "@/entities/order/model/model"
import type { Order } from "@/entities/order/model/types"
import { useAuth } from "@/shared/auth"
import { orderApi } from "@/entities/order/model/api"
import { useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/shared/ui/PageHeader"
import { MonchitoTabs, type MonchitoTabConfig } from "@/shared/ui/MonchitoTabs"

const ORDER_TABS: MonchitoTabConfig[] = [
    { id: 'ALL', label: 'Todos', icon: LayoutDashboard },
    { id: 'POR_RECIBIR', label: 'Por Recibir', icon: Package },
    { id: 'RECIBIDO', label: 'Recibido', icon: ShoppingBag },
    { id: 'ATRASADO', label: 'Atrasado', icon: Clock },
    { id: 'CANCELADO', label: 'Cancelado', icon: XCircle },
]

interface OrderListProps {
    searchQuery: string
    onSearchChange: (query: string) => void
}

export function OrderList({ searchQuery, onSearchChange }: OrderListProps) {
    const { data: orders = [], isLoading } = useOrderList()
    const deleteOrder = useDeleteOrder()
    const { showToast } = useToast()
    const qc = useQueryClient()
    const {
        statusFilter,
        setStatusFilter,
        filteredOrders
    } = useOrderFilters(orders, searchQuery)
    const { hasPermission } = useAuth()

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [modalMode, setModalMode] = useState<'none' | 'detail' | 'create' | 'edit' | 'delete' | 'reverse'>('none')

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order)
        setModalMode('detail')
    }

    const handleEdit = (order: Order) => {
        if (!hasPermission('orders.edit')) {
            showToast('No tienes permiso para editar pedidos', 'error')
            return
        }
        setSelectedOrder(order)
        setModalMode('edit')
    }

    const handleReverseClick = (order: Order) => {
        setSelectedOrder(order)
        setModalMode('reverse')
    }

    const handleConfirmReverse = async () => {
        if (!selectedOrder) return
        try {
            await orderApi.reverseReception(selectedOrder.id)
            showToast("La recepción ha sido revertida correctamente.", "success")
            await qc.invalidateQueries({ queryKey: ['orders'] })
            setModalMode('none')
            setSelectedOrder(null)
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al revertir recepción", "error")
        }
    }

    const handleDeleteClick = (order: Order) => {
        if (!hasPermission('orders.delete')) {
            showToast('No tienes permiso para eliminar pedidos', 'error')
            return
        }
        setSelectedOrder(order)
        setModalMode('delete')
    }

    const handleConfirmDelete = async () => {
        if (!selectedOrder) return

        try {
            await deleteOrder.mutateAsync(selectedOrder.id)
            showToast(`Pedido ${selectedOrder.receiptNumber} eliminado físicamente y saldos revertidos`, 'success')
            setModalMode('none')
            setSelectedOrder(null)
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error al eliminar el pedido', 'error')
        }
    }

    const handleCreate = () => {
        if (!hasPermission('orders.create')) {
            showToast('No tienes permiso para crear pedidos', 'error')
            return
        }
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
                <div className="h-20 w-full bg-slate-100 animate-pulse rounded-xl" />
                <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl" />
            </div>
        )
    }

    return (
        <div className="space-y-4 min-w-0 max-w-full overflow-hidden">
            <PageHeader
                title="Pedidos"
                description="Gestión centralizada de pedidos, estados de entrega y facturación."
                icon={ShoppingBag}
                actions={
                    <Button onClick={handleCreate} className="bg-monchito-purple hover:bg-monchito-purple/90 shadow-md font-bold transition-all active:scale-95">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
                    </Button>
                }
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <MonchitoTabs
                    tabs={ORDER_TABS}
                    activeTab={statusFilter}
                    onTabChange={(id) => setStatusFilter(id as any)}
                />
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar cliente, marca, recibo..."
                        className="pl-9 bg-white border-slate-200 focus:ring-monchito-purple/20 transition-all shadow-sm rounded-xl h-10"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-16 border rounded-xl bg-white text-slate-400 shadow-sm">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="font-medium">No se encontraron pedidos con estos criterios.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                    <OrderTable
                        orders={filteredOrders}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onReverse={handleReverseClick}
                    />
                </div>
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
                    open={modalMode === 'reverse'}
                    onOpenChange={(open) => !open && handleClose()}
                    onConfirm={handleConfirmReverse}
                    title="Regresar Recepción"
                    description={`¿Estás seguro de regresar la recepción del pedido ${selectedOrder.receiptNumber}?`}
                    confirmText="Regresar Recepción"
                    cancelText="Cancelar"
                >
                    <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800 text-sm">
                        <p>Esta acción:</p>
                        <ul className="list-disc ml-4 mt-1">
                            <li>Revertirá el abono realizado en la recepción del banco.</li>
                            <li>Eliminará la factura real y movimientos de inventario asociados.</li>
                            <li>El pedido volverá al estado <strong>POR RECIBIR</strong>.</li>
                        </ul>
                    </div>
                </ConfirmDialog>
            )}

            {selectedOrder && (
                <ConfirmDialog
                    open={modalMode === 'delete'}
                    onOpenChange={(open) => !open && handleClose()}
                    onConfirm={handleConfirmDelete}
                    title="Eliminar Pedido"
                    description={`¿Estás seguro de eliminar PERMANENTEMENTE el pedido ${selectedOrder.receiptNumber}?`}
                    confirmText="Eliminar Físicamente"
                    cancelText="Cancelar"
                    variant="destructive"
                >
                    <div className="space-y-3 text-sm">
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                            <p className="font-medium text-red-900 mb-2">⚠️ ATENCIÓN: Eliminación Física</p>
                            <ul className="space-y-1 text-red-800">
                                <li>• El pedido será <strong>BORRADO COMPLETAMENTE</strong> de la base de datos.</li>
                                {getPaidAmount(selectedOrder) > 0 && (
                                    <li>• Los abonos realizados serán <strong>REVERTIDOS</strong> de los saldos bancarios.</li>
                                )}
                                <li>• Se eliminarán items, premios y registros financieros vinculados.</li>
                                <li>• Esta acción NO se puede deshacer y es auditable.</li>
                            </ul>
                        </div>

                        <div className="text-muted-foreground border-t pt-2">
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
