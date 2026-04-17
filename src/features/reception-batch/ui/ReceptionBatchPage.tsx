import { useState } from "react"
import { Truck, FileDown, Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { PageHeader } from "@/shared/ui/PageHeader"
import { exportOrdersToExcel } from "@/shared/lib/exportExcel"
import { useReceptionBatch } from "../model/useReceptionBatch"
import { PendingOrdersTable } from "./PendingOrdersTable"
import { ReceptionZone } from "./ReceptionZone"
import { ReceptionHistory } from "./ReceptionHistory"
import { BatchPrintModal } from "./BatchPrintModal"
import { useAuth } from "@/shared/auth"
import { useNotifications } from "@/shared/lib/notifications"
import { useLocking } from "@/features/lock-management/hooks/useLocking"
import { ConcurrencyLockDialog } from "@/shared/ui/ConcurrencyLockDialog"

export function ReceptionBatchPage() {
    const { hasPermission } = useAuth()
    const { notifyError } = useNotifications()
    const {
        allOrders,
        selectedOrders,
        packingNumber,
        packingTotal,
        setPackingNumber,
        setPackingTotal,
        addOrders,
        removeOrder,
        handleSaveBatch,
        isSaving,
        batches,
        deleteBatch,
        isDeleting,
        updateOrderItem,
        lastSavedOrders,
        lastSavedBatch,
        clearLastSaved,
        editingBatchId,
        startEditingBatch,
        cancelEdit,
        historyPage,
        setHistoryPage,
        historyFilters,
        setHistoryFilters,
        pagination,
        pendingPage,
        setPendingPage,
        pendingPagination,
        pendingFilters,
        setPendingFilters,
        clientOptions,
        handleExport,
        isExporting
    } = useReceptionBatch();

    // Manejo de Bloqueos por Concurrencia
    const { isLockedByOther, lockingUser, isLockingLoading } = useLocking({
        resourceId: editingBatchId || undefined,
        resourceType: 'RECEPTION_BATCH',
        enabled: !!editingBatchId
    });

    const [activeTab, setActiveTab] = useState("reception");

    if (isLockingLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50 rounded-2xl">
                <div className="h-10 w-10 border-4 border-monchito-purple border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-slate-500 font-medium text-sm animate-pulse">Verificando disponibilidad del lote...</p>
            </div>
        );
    }

    const onEditBatch = (batch: any) => {
        if (!hasPermission('reception.edit')) {
            notifyError({ message: 'No tienes permiso para editar recepciones' })
            return
        }
        startEditingBatch(batch);
        setActiveTab("reception");
    };

    const onConfirmBatch = () => {
        if (!hasPermission('reception.confirm')) {
            notifyError({ message: 'No tienes permiso para finalizar recepciones' })
            return
        }
        handleSaveBatch();
    };

    const onDeleteBatch = (id: string) => {
        if (!hasPermission('reception.delete')) {
            notifyError({ message: 'No tienes permiso para eliminar recepciones' })
            return
        }
        deleteBatch(id);
    };

    const onExport = async () => {
        const orders = await handleExport();
        
        if (!orders || orders.length === 0) {
            notifyError({ message: 'No hay datos para exportar con los filtros actuales' });
            return;
        }

        exportOrdersToExcel(
            orders, 
            `Recepcion_Pendiente_${new Date().toISOString().split('T')[0]}.xlsx`,
            { 
                brandId: pendingFilters.brandId === 'ALL' ? undefined : (pendingFilters.brandId || undefined),
                orderNumber: pendingFilters.orderNumber || undefined
            }
        );
    };


    return (
        <div className="space-y-6">
            <PageHeader
                title={editingBatchId ? 'Editando Recepción' : 'Recepción de Pedidos (Bodega)'}
                description={editingBatchId ? 'Modificando un lote de pedidos ya registrado' : 'Gestión y control de entrada de mercadería'}
                icon={Truck}
                actions={
                    <div className="flex items-center gap-3">
                         {editingBatchId && (
                            <Button
                                variant="outline"
                                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold transition-all"
                                onClick={cancelEdit}
                            >
                                Cancelar Edición
                            </Button>
                        )}
                        {activeTab === "reception" && (
                            <Button
                                variant="outline"
                                onClick={onExport}
                                disabled={isExporting}
                                className="bg-white hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 transition-all font-bold"
                            >
                                {isExporting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <FileDown className="mr-2 h-4 w-4 text-emerald-600" />
                                )}
                                <span className="hidden sm:inline">Exportar Excel</span>
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button
                                variant={activeTab === "reception" ? "default" : "outline"}
                                className={activeTab === "reception"
                                    ? "bg-monchito-purple hover:bg-monchito-purple/90 text-white"
                                    : "border-monchito-purple/20 text-monchito-purple/60 hover:bg-monchito-purple/5 hover:text-monchito-purple"
                                }
                                onClick={() => setActiveTab("reception")}
                            >
                                {editingBatchId ? 'Zona de Edición' : 'Nueva Recepción'}
                            </Button>
                            <Button
                                variant={activeTab === "history" ? "default" : "outline"}
                                className={activeTab === "history"
                                    ? "bg-monchito-purple hover:bg-monchito-purple/90 text-white"
                                    : "border-monchito-purple/20 text-monchito-purple/60 hover:bg-monchito-purple/5 hover:text-monchito-purple"
                                }
                                onClick={() => setActiveTab("history")}
                            >
                                Historial
                            </Button>
                        </div>
                    </div>
                }
            />

            <div className="flex-1 overflow-hidden text-sm">
                {activeTab === "reception" ? (
                    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                        {/* Panel Superior: Pedidos Pendientes */}
                        <div className="min-h-[700px] flex flex-col shrink-0">
                            <div className="mb-3">
                                <h3 className="text-sm font-bold text-monchito-purple flex items-center gap-2">
                                    <span className="bg-monchito-purple/10 text-monchito-purple w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                    Pedidos Pendientes de Recepción
                                </h3>
                            </div>
                            <PendingOrdersTable 
                                orders={allOrders} 
                                onMove={addOrders} 
                                pagination={pendingPagination}
                                currentPage={pendingPage}
                                onPageChange={setPendingPage}
                                filters={pendingFilters}
                                onFiltersChange={setPendingFilters}
                                clientOptions={clientOptions}
                            />
                        </div>

                        {/* Panel Inferior: Zona de Recepción Actual */}
                        <div className="min-h-[700px] flex flex-col shrink-0">
                            <ReceptionZoneIntegration
                                selectedOrders={selectedOrders}
                                removeOrder={removeOrder}
                                onConfirmBatch={onConfirmBatch}
                                isSaving={isSaving}
                                packingNumber={packingNumber}
                                packingTotal={packingTotal}
                                setPackingNumber={setPackingNumber}
                                setPackingTotal={setPackingTotal}
                                updateOrderItem={updateOrderItem}
                                editingBatchId={editingBatchId}
                            />
                        </div>

                        {/* Mensaje cuando no hay datos en ninguna tabla */}
                        {allOrders.length === 0 && selectedOrders.length === 0 && (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center p-8 rounded-lg bg-slate-50/50 text-slate-400">
                                    <Truck className="mx-auto h-12 w-12 mb-4 text-slate-300" />
                                    <p className="text-lg font-medium mb-2">No hay pedidos disponibles</p>
                                    <p className="text-sm">Los pedidos aparecerán aquí cuando estén listos para recepción</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <ReceptionHistory
                        batches={batches}
                        pagination={pagination}
                        onEdit={onEditBatch}
                        onDelete={onDeleteBatch}
                        isDeleting={isDeleting}
                        page={historyPage}
                        onPageChange={setHistoryPage}
                        filters={historyFilters}
                        onFilterChange={setHistoryFilters}
                    />
                )}
            </div>

            <BatchPrintModal
                isOpen={!!lastSavedOrders}
                onClose={clearLastSaved}
                orders={lastSavedOrders || []}
                batchDetails={lastSavedBatch}
            />

            <ConcurrencyLockDialog
                isOpen={isLockedByOther}
                lockingUser={lockingUser}
                resourceName="lote de recepción"
                onClose={cancelEdit}
            />
        </div>
    );
}

// Subcomponent integration for better clarity in the render
function ReceptionZoneIntegration({ selectedOrders, removeOrder, onConfirmBatch, isSaving, packingNumber, packingTotal, setPackingNumber, setPackingTotal, updateOrderItem, editingBatchId }: any) {
    return (
        <ReceptionZone
            selectedOrders={selectedOrders}
            onRemove={removeOrder}
            onConfirm={onConfirmBatch}
            isProcessing={isSaving}
            packingNumber={packingNumber}
            packingTotal={packingTotal}
            setPackingNumber={setPackingNumber}
            setPackingTotal={setPackingTotal}
            onUpdateOrder={updateOrderItem}
            isEditing={!!editingBatchId}
        />
    )
}
