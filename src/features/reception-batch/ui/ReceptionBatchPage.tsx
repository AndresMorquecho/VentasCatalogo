import { useState } from "react"
import { Truck } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { PageHeader } from "@/shared/ui/PageHeader"
import { useReceptionBatch } from "../model/useReceptionBatch"
import { PendingOrdersTable } from "./PendingOrdersTable"
import { ReceptionZone } from "./ReceptionZone"
import { ReceptionHistory } from "./ReceptionHistory"
import { BatchPrintModal } from "./BatchPrintModal"

export function ReceptionBatchPage() {
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
        editingBatchId,
        startEditingBatch,
        cancelEdit,
        updateOrderItem,
        lastSavedOrders,
        lastSavedBatch,
        clearLastSaved
    } = useReceptionBatch();

    const [activeTab, setActiveTab] = useState("reception");

    const onEditBatch = (batch: any) => {
        startEditingBatch(batch);
        setActiveTab("reception");
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={editingBatchId ? 'Editando Recepción Batch' : 'Recepción de Pedidos (Bodega)'}
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
                    <div className="flex flex-col gap-6 h-full overflow-hidden">
                        {/* Panel Superior: Pedidos Pendientes - Se colapsa si no hay datos */}
                        {allOrders.length > 0 && (
                            <div className={selectedOrders.length > 0 ? "h-96" : "flex-1"}>
                                <div className="mb-3">
                                    <h3 className="text-sm font-bold text-monchito-purple flex items-center gap-2">
                                        <span className="bg-monchito-purple/10 text-monchito-purple w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                        Pedidos Pendientes de Recepción
                                    </h3>
                                </div>
                                <PendingOrdersTable orders={allOrders} onMove={addOrders} />
                            </div>
                        )}

                        {/* Panel Inferior: Zona de Recepción Actual - Se colapsa si no hay datos */}
                        {selectedOrders.length > 0 && (
                            <div className={allOrders.length > 0 ? "h-96" : "flex-1"}>
                                <ReceptionZone
                                    selectedOrders={selectedOrders}
                                    onRemove={removeOrder}
                                    onConfirm={handleSaveBatch}
                                    isProcessing={isSaving}
                                    packingNumber={packingNumber}
                                    packingTotal={packingTotal}
                                    setPackingNumber={setPackingNumber}
                                    setPackingTotal={setPackingTotal}
                                    onUpdateOrder={updateOrderItem}
                                    isEditing={!!editingBatchId}
                                />
                            </div>
                        )}

                        {/* Mensaje cuando no hay datos en ninguna tabla */}
                        {allOrders.length === 0 && selectedOrders.length === 0 && (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
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
                        clients={[]}
                        onEdit={onEditBatch}
                        onDelete={deleteBatch}
                        isDeleting={isDeleting}
                    />
                )}
            </div>

            <BatchPrintModal
                isOpen={!!lastSavedOrders}
                onClose={clearLastSaved}
                orders={lastSavedOrders || []}
                batchDetails={lastSavedBatch}
            />
        </div>
    );
}
