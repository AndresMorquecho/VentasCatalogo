import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { DateRange } from "react-day-picker"
import { startOfDay, endOfDay } from "date-fns"
import { Skeleton } from "@/shared/ui/skeleton"
import { useOrderList, useDeleteOrder } from "@/entities/order/model/hooks"
import type { OrderFilterType } from "../model/useOrderFilters"
import { OrderFilters } from "./OrderFilters"
import { OrderTable } from "./OrderTable"
import { OrderDetailModal } from "./OrderDetailModal"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { logAction } from "@/shared/lib/auditService"
import { useNotifications } from "@/shared/lib/notifications"
import type { Order } from "@/entities/order/model/types"
import { useAuth } from "@/shared/auth"

import { useDebounce } from "@/shared/lib/hooks"
import { Pagination } from "@/shared/ui/pagination"
import { Badge } from "@/shared/ui/badge";
import { Users, RotateCw } from "lucide-react";
import { useCashClosures } from "@/features/cash-closure/api/hooks"

export function OrderList({ triggerCreate, onTriggerHandled, externalFilters }: {
    triggerCreate?: boolean;
    onTriggerHandled?: () => void;
    externalFilters?: {
        dateRange: DateRange | undefined;
        setDateRange: (r: DateRange | undefined) => void;
        debouncedDateRange: DateRange | undefined;
        statusFilter: OrderFilterType;
        setStatusFilter: (s: OrderFilterType) => void;
        // Advanced Filters
        clientId?: string;
        setClientId: (id: string | undefined) => void;
        brandId?: string;
        setBrandId: (id: string | undefined) => void;
        receiptNumber: string;
        setReceiptNumber: (rn: string) => void;
        orderNumber: string;
        setOrderNumber: (on: string) => void;
        typeFilter: string;
        setTypeFilter: (t: string) => void;
    }
}) {
    const [page, setPage] = useState(1)
    const [limit] = useState(25)

    const { data: closuresResponse } = useCashClosures({ limit: 1 })
    const lastClosure = closuresResponse?.data?.[0]
    const lastClosureDate = lastClosure ? new Date(lastClosure.toDate) : null

    // Fallback local states
    const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>()
    const localDebouncedDateRange = useDebounce(localDateRange, 500)
    const [localStatusFilter, setLocalStatusFilter] = useState<OrderFilterType>('ALL')

    const [localClientId, setLocalClientId] = useState<string | undefined>()
    const [localBrandId, setLocalBrandId] = useState<string | undefined>()
    const [localReceiptNumber, setLocalReceiptNumber] = useState('')
    const [localOrderNumber, setLocalOrderNumber] = useState('')
    const [localTypeFilter, setLocalTypeFilter] = useState('')

    // Use external filters if provided, otherwise fallback to local state
    const dateRange = externalFilters ? externalFilters.dateRange : localDateRange
    const setDateRange = externalFilters ? externalFilters.setDateRange : setLocalDateRange
    const debouncedDateRange = externalFilters ? externalFilters.debouncedDateRange : localDebouncedDateRange

    const statusFilter = externalFilters ? externalFilters.statusFilter : localStatusFilter
    const setStatusFilter = externalFilters ? externalFilters.setStatusFilter : setLocalStatusFilter

    const clientId = externalFilters ? externalFilters.clientId : localClientId
    const setClientId = externalFilters ? externalFilters.setClientId : setLocalClientId

    const brandId = externalFilters ? externalFilters.brandId : localBrandId
    const setBrandId = externalFilters ? externalFilters.setBrandId : setLocalBrandId

    const receiptNumber = externalFilters ? externalFilters.receiptNumber : localReceiptNumber
    const setReceiptNumber = externalFilters ? externalFilters.setReceiptNumber : setLocalReceiptNumber

    const orderNumber = externalFilters ? externalFilters.orderNumber : localOrderNumber
    const setOrderNumber = externalFilters ? externalFilters.setOrderNumber : setLocalOrderNumber

    const typeFilter = externalFilters ? externalFilters.typeFilter : localTypeFilter
    const setTypeFilter = externalFilters ? externalFilters.setTypeFilter : setLocalTypeFilter

    const debouncedReceipt = useDebounce(receiptNumber, 500)
    const debouncedOrderNo = useDebounce(orderNumber, 500)

    const { data: response, isLoading } = useOrderList({
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        startDate: debouncedDateRange?.from ? startOfDay(debouncedDateRange.from).toISOString() : undefined,
        endDate: debouncedDateRange?.to ? endOfDay(debouncedDateRange.to).toISOString() : undefined,
        clientId,
        brandId,
        receiptNumber: debouncedReceipt || undefined,
        orderNumber: debouncedOrderNo || undefined,
        type: typeFilter === 'ALL' ? undefined : (typeFilter || undefined),
        onlyParents: false
    })

    const orders = response?.data || []
    const pagination = response?.pagination;

    const deleteOrder = useDeleteOrder()
    const { notifySuccess, notifyError, notifyLoading, dismiss } = useNotifications()
    const { hasPermission, user } = useAuth()
    const navigate = useNavigate()

    // Reset to page 1 when filtering
    useEffect(() => {
        setPage(1)
    }, [statusFilter, debouncedDateRange, clientId, brandId, debouncedReceipt, debouncedOrderNo, typeFilter])

    // Handle external trigger to open create
    useEffect(() => {
        if (triggerCreate) {
            handleCreate()
            onTriggerHandled?.()
        }
    }, [triggerCreate])

    // Show all orders individually (ungrouped)
    const filteredOrders = useMemo(() => {
        return orders as Order[]
    }, [orders])

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
            notifyLoading(`Eliminando recibo ${selectedOrder.receiptNumber} y revirtiendo cargos...`)
            await deleteOrder.mutateAsync({ id: selectedOrder.id, cascade: true })
            
            dismiss()
            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'DELETE_ORDER',
                    module: 'orders',
                    detail: `Eliminó recibo completo ${selectedOrder.receiptNumber} y todos sus pedidos asociados de la empresaria: ${selectedOrder.clientName}.`
                });
            }
            notifySuccess(`Recibo ${selectedOrder.receiptNumber} y todos sus pedidos asociados eliminados correctamente.`)
            setModalMode('none')
            setSelectedOrder(null)
        } catch (error) {
            dismiss()
            notifyError(error, 'Error al eliminar el recibo')
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
            <OrderFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                clientId={clientId}
                onClientChange={setClientId}
                brandId={brandId}
                onBrandChange={setBrandId}
                receiptNumber={receiptNumber}
                onReceiptNumberChange={setReceiptNumber}
                orderNumber={orderNumber}
                onOrderNumberChange={setOrderNumber}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
            />

            <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-monchito-purple/10 text-monchito-purple border-monchito-purple/20 px-3 py-1 text-[11px] font-bold h-7">
                        <Users className="h-3 w-3 mr-1.5" />
                        {pagination?.total || 0} Registros encontrados
                    </Badge>
                    {(statusFilter !== 'ALL' || dateRange || clientId || brandId || receiptNumber || orderNumber || typeFilter) && (
                        <span className="text-[10px] text-muted-foreground italic font-medium">
                            (Filtros activos)
                        </span>
                    )}
                </div>
                {(statusFilter !== 'ALL' || dateRange || clientId || brandId || receiptNumber || orderNumber || typeFilter) && (
                    <button 
                        onClick={() => {
                            setLocalStatusFilter('ALL');
                            setLocalDateRange(undefined);
                            setClientId(undefined);
                            setBrandId(undefined);
                            setReceiptNumber('');
                            setOrderNumber('');
                            setTypeFilter('');
                            setPage(1);
                        }}
                        className="text-[10px] flex items-center gap-1.5 font-bold text-red-600 hover:text-red-700 uppercase tracking-wider px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <RotateCw className="h-3 w-3" /> Limpiar Filtros
                    </button>
                )}
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
                    title="Eliminar Recibo Completo"
                    description={`¿Estás seguro de eliminar PERMANENTEMENTE el recibo ${selectedOrder.receiptNumber}?`}
                    confirmText="Eliminar Todo el Recibo"
                    cancelText="Cancelar"
                    variant="destructive"
                >
                    <div className="space-y-3 text-sm">
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                            <p className="font-bold text-red-900 mb-2">PELIGRO: Eliminación Grupal por Recibo</p>
                            <ul className="space-y-1.5 text-red-800 font-medium">
                                <li>• Se borrarán <strong>TODOS</strong> los pedidos asociados a este recibo ({selectedOrder.receiptNumber}).</li>
                                <li>• Los abonos realizados serán <strong>REVERTIDOS</strong> automáticamente.</li>
                                <li>• Se eliminarán productos, premios y registros financieros vinculados.</li>
                                <li>• Esta acción NO se puede deshacer.</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                            <div>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                                <span className="font-bold text-slate-700">{selectedOrder.clientName}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Acción</span>
                                <span className="font-bold text-red-600 italic">Limpieza de Recibo</span>
                            </div>
                        </div>
                    </div>
                </ConfirmDialog>
            )}
        </div>
    )
}
