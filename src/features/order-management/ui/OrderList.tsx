import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Skeleton } from "@/shared/ui/skeleton"
import { Button } from "@/shared/ui/button"
import { Plus } from "lucide-react"
import { useOrderList, useDeleteOrder } from "@/entities/order/model/hooks"
import { useOrderFilters } from "../model/useOrderFilters"
import { OrderFilters } from "./OrderFilters"
import { OrderTable } from "./OrderTable"
import { OrderDetailModal } from "./OrderDetailModal"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { logAction } from "@/shared/lib/auditService"
import { useNotifications } from "@/shared/lib/notifications"
import { getPaidAmount } from "@/entities/order/model/model"
import type { Order } from "@/entities/order/model/types"
import { useAuth } from "@/shared/auth"

import { useDebounce } from "@/shared/lib/hooks"
import { Pagination } from "@/shared/ui/pagination"
import { useCashClosures } from "@/features/cash-closure/api/hooks"

export function OrderList() {
    const [page, setPage] = useState(1)
    const [limit] = useState(25)

    const { data: closuresResponse } = useCashClosures({ limit: 1 })
    const lastClosure = closuresResponse?.data?.[0]
    const lastClosureDate = lastClosure ? new Date(lastClosure.toDate) : null

    // We keep the internal search query for the input, but debounce it for the API/filtering
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebounce(searchQuery, 1000)

    const {
        statusFilter,
        setStatusFilter,
    } = useOrderFilters([]) // We'll manage filtering differently now with pagination

    const { data: response, isLoading } = useOrderList({
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
        onlyParents: true
    })

    const orders = response?.data || []
    const pagination = response?.pagination

    const deleteOrder = useDeleteOrder()
    const { notifySuccess, notifyError } = useNotifications()
    const { hasPermission, user } = useAuth()
    const navigate = useNavigate()

    // Reset to page 1 when filtering
    useEffect(() => {
        setPage(1)
    }, [statusFilter, debouncedSearch])

    // Local filtering for quick results while typing < 3 chars or as a second layer
    const filteredOrders = useMemo(() => {
        const parentsOnly = orders.filter(o => !o.parentOrderId)

        if (debouncedSearch.length > 0 && debouncedSearch.length < 3) {
            const query = debouncedSearch.toLowerCase()
            return parentsOnly.filter(o =>
                o.clientName.toLowerCase().includes(query) ||
                o.receiptNumber.toLowerCase().includes(query) ||
                (o.orderNumber && o.orderNumber.toLowerCase().includes(query)) ||
                o.brandName.toLowerCase().includes(query) ||
                o.childOrders?.some(child =>
                    (child.orderNumber && child.orderNumber.toLowerCase().includes(query)) ||
                    (child.invoiceNumber && child.invoiceNumber.toLowerCase().includes(query))
                )
            )
        }
        return parentsOnly
    }, [orders, debouncedSearch])

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [modalMode, setModalMode] = useState<'none' | 'detail' | 'create' | 'edit' | 'delete'>('none')

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order)
        setModalMode('detail')
    }

    const handleEdit = (order: Order) => {
        if (!hasPermission('orders.edit')) {
            notifyError({ message: 'No tienes permiso para editar pedidos' })
            return
        }

        const isClosed = lastClosureDate && order.transactionDate && new Date(order.transactionDate) <= lastClosureDate;
        if (isClosed) {
            notifyError({ message: 'No se puede editar: El periodo de caja ya está cerrado.' })
            return
        }

        // Note: Individual movement/status checks are performed inside OrderFormPage 
        // per order item, allowing editing of other items in the same receipt.

        if (order.receiptNumber && order.receiptNumber.trim() !== "") {
            navigate(`/orders/group/${order.receiptNumber}`)
        } else {
            navigate(`/orders/edit/${order.id}`)
        }
    }

    const handleDeleteClick = (order: Order) => {
        if (!hasPermission('orders.delete')) {
            notifyError({ message: 'No tienes permiso para eliminar pedidos' })
            return
        }
        setSelectedOrder(order)
        setModalMode('delete')
    }

    const handleConfirmDelete = async () => {
        if (!selectedOrder) return

        try {
            await deleteOrder.mutateAsync(selectedOrder.id)
            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'DELETE_ORDER',
                    module: 'orders',
                    detail: `Eliminó pedido ${selectedOrder.receiptNumber} de la empresaria: ${selectedOrder.clientName}. Monto revertido de saldos.`
                });
            }
            notifySuccess(`Pedido ${selectedOrder.receiptNumber} eliminado físicamente y saldos revertidos`)
            setModalMode('none')
            setSelectedOrder(null)
        } catch (error) {
            notifyError(error, 'Error al eliminar el pedido')
        }
    }

    const handleCreate = () => {
        if (!hasPermission('orders.create')) {
            notifyError({ message: 'No tienes permiso para crear pedidos' })
            return
        }
        navigate('/orders/new')
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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h2 className="text-base font-medium text-muted-foreground tracking-tight">
                    Listado de Pedidos
                </h2>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
                </Button>
            </div>

            <OrderFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

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
                    lastClosureDate={lastClosureDate}
                />
            )}

            {pagination && (
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            )}

            <OrderDetailModal
                order={selectedOrder}
                open={modalMode === 'detail'}
                onOpenChange={(open) => !open && handleClose()}
            />



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
                            <p className="font-medium text-red-900 mb-2">ATENCIÓN: Eliminación Física</p>
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
                            <p><strong>Catalogo:</strong> {selectedOrder.brandName}</p>
                            <p><strong>Total:</strong> ${selectedOrder.total.toFixed(2)}</p>
                        </div>
                    </div>
                </ConfirmDialog>
            )}
        </div>
    )
}
