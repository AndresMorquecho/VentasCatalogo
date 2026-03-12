import { useState } from "react"
import { Truck } from "lucide-react"
import { Button } from "@/shared/ui/button"
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
        clearLastSaved
    } = useReceptionBatch();

    const [activeTab, setActiveTab] = useState("reception");

    const onEditBatch = (batch: any) => {
        startEditingBatch(batch);
        setActiveTab("reception"); 
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 bg-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shadow-sm border border-emerald-100">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            {editingBatchId ? 'Editando Recepción Batch' : 'Recepción de Pedidos (Bodega)'}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {editingBatchId ? 'Modificando un lote de pedidos ya registrado' : 'Gestión y control de entrada de mercadería'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    {editingBatchId && (
                        <Button 
                            variant="outline" 
                            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold transition-all"
                            onClick={cancelEdit}
                        >
                            Cancelar Edición
                        </Button>
                    )}
                    <div className="bg-slate-100 p-1 rounded-lg flex shadow-inner border border-slate-200/50">
                        <Button
                            variant={activeTab === "reception" ? "default" : "ghost"}
                            className={`${activeTab === "reception" ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"} h-8 px-4 rounded-md text-xs font-bold transition-all`}
                            onClick={() => setActiveTab("reception")}
                        >
                            {editingBatchId ? 'Zona de Edición' : 'Nueva Recepción'}
                        </Button>
                        <Button
                            variant={activeTab === "history" ? "default" : "ghost"}
                            className={`${activeTab === "history" ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"} h-8 px-4 rounded-md text-xs font-bold transition-all`}
                            onClick={() => setActiveTab("history")}
                        >
                            Historial
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6 text-sm">
                {activeTab === "reception" ? (
                    <div className="flex flex-col gap-6 h-full overflow-hidden">
                        {/* Panel Superior: Pedidos Pendientes */}
                        <div className="flex-1 min-h-0">
                            <PendingOrdersTable orders={allOrders} onMove={addOrders} />
                        </div>

                        {/* Panel Inferior: Zona de Recepción Actual */}
                        <div className="flex-1 min-h-0">
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
            />
        </div>
    );
}
