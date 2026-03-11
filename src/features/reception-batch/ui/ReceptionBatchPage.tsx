import { useState } from "react"
import { useReceptionBatch } from "../model/useReceptionBatch"
import { PendingOrdersTable } from "./PendingOrdersTable"
import { SelectedOrdersTable } from "./SelectedOrdersTable"
import { ReceptionHistory } from "./ReceptionHistory"
import { useToast } from "@/shared/ui/use-toast"
import { generateOrderLabels } from "@/features/order-labels/lib/generateOrderLabels"
import { ArrowDown, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { useAuth } from "@/shared/auth"
import { logAction } from "@/shared/lib/auditService"

export function ReceptionBatchPage() {
    const {
        allOrders,
        pendingOrders,
        selectedOrders,
        moveToSelected,
        moveToPending,
        updateInvoiceTotal,
        updateInvoiceNumber,
        updateDocumentType,
        updateEntryDate,
        saveBatch,
        isLoading,
        clients,
        packingNumber,
        setPackingNumber,
        packingTotal,
        setPackingTotal
    } = useReceptionBatch()

    const { user, hasPermission } = useAuth()
    const { showToast } = useToast()
    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleSaveRequest = () => {
        if (selectedOrders.length === 0) return
        setConfirmOpen(true)
    }

    const confirmSave = async () => {
        if (!hasPermission('reception.confirm')) {
            showToast("No tienes permiso para confirmar recepciones", "error")
            return
        }

        // --- VALIDACIONES ---
        if (!packingNumber.trim()) {
            showToast("Debe ingresar el N° de Packing Empresa", "error")
            return
        }

        if (packingTotal === undefined || packingTotal === null || isNaN(packingTotal)) {
            showToast("Debe ingresar un valor válido para el packing", "error")
            return
        }

        if (packingTotal < 0) {
            showToast("El valor del packing no puede ser negativo", "error")
            return
        }

        if (selectedOrders.length === 0) {
            showToast("No hay pedidos seleccionados para recibir", "error")
            return
        }

        // Validaciones por cada pedido
        for (const item of selectedOrders) {
            if (!item.finalInvoiceNumber.trim()) {
                showToast(`Debe ingresar el número de factura para el pedido ${item.order.receiptNumber}`, "error")
                return
            }
            if (item.finalTotal < 0) {
                showToast(`El valor de factura para el pedido ${item.order.receiptNumber} no puede ser negativo`, "error")
                return
            }
        }

        try {
            const updatedOrders = await saveBatch.mutateAsync({
                ordersToSave: selectedOrders,
                packingNumber: packingNumber,
                packingTotal: packingTotal
            });

            await generateOrderLabels({
                orders: updatedOrders,
                clients: clients,
                user: { name: user?.username || 'Operador' }
            })

            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'CONFIRM_RECEPTION',
                    module: 'reception',
                    detail: `Procesó recepción de ${updatedOrders.length} pedidos. Packing: ${packingNumber || 'N/A'}`
                });
            }

            showToast(`Recepción de ${updatedOrders.length} pedidos procesada exitosamente. Etiquetas generadas.`, "success")
            setConfirmOpen(false)

        } catch (error: any) {
            console.error("Error en recepción batch:", error)
            showToast(error.message || "Hubo un error al procesar la recepción.", "error")
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8 bg-slate-50">
                <Spinner label="Cargando pedidos..." />
            </div>
        )
    }

    // Calculations for Dialog
    const totalInvoices = selectedOrders.reduce((sum, o) => sum + o.finalTotal, 0);
    const totalPrevPaid = selectedOrders.reduce((sum, o) => sum + (o.order.payments || []).reduce((acc, p) => acc + p.amount, 0), 0);
    const globalRemaining = Math.max(0, totalInvoices - totalPrevPaid);

    return (
        <div className="h-[calc(100vh-70px)] w-full bg-slate-50 p-2 flex flex-col gap-2 overflow-hidden mx-auto">
            <div className="px-1 shrink-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Recepción de Pedidos
                </h1>
            </div>

            <Tabs defaultValue="new" className="flex-1 flex flex-col min-h-0 -mt-1">
                {/* Header Compacto */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 mb-2 px-1">
                    <h2 className="text-base font-medium text-muted-foreground tracking-tight">
                        Gestión de Entradas
                    </h2>

                    <div className="bg-white p-1 rounded-lg border shadow-sm">
                        <TabsList className="flex gap-1 bg-transparent p-0 h-9">
                            <TabsTrigger
                                value="new"
                                className="px-3 py-1.5 text-xs data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:font-bold rounded-md"
                            >
                                Nueva Recepción
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="px-3 py-1.5 text-xs data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-bold rounded-md"
                            >
                                Historial
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                {/* Content Area */}
                <TabsContent value="new" className="flex-1 min-h-0 flex flex-col gap-4 data-[state=inactive]:hidden pb-2">
                    {/* Top Section: Source (Pending) - Allocating 50% of vertical space */}
                    <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden min-h-0 mb-1">
                        <div className="p-2 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                                Pendientes
                            </h2>
                            <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                {pendingOrders.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0 p-0">
                            <PendingOrdersTable orders={pendingOrders} onMove={moveToSelected} />
                        </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex justify-center -my-6 z-10 relative pointer-events-none">
                        <div className="bg-slate-50 rounded-full p-0.5 border border-slate-200 shadow-sm text-slate-400 bg-white">
                            <ArrowDown className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Bottom Section: Target (Reception) - Takes remaining space */}
                    <div className="flex-1 flex flex-col bg-white rounded-lg border border-emerald-100 shadow-md ring-1 ring-emerald-500/10 overflow-hidden min-h-0 mt-1">
                        <div className="p-2 border-b bg-emerald-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                                    <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                                    Zona de Recepción
                                </h2>
                                <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                    {selectedOrders.length}
                                </span>
                            </div>

                            <div className="flex flex-1 flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
                                {/* Batch Packing Details */}
                                <div className="flex gap-2 items-center">
                                    <div className="flex flex-col gap-0.5">
                                        <Label className="text-[10px] text-emerald-700 font-bold uppercase">N° Packing Empresa</Label>
                                        <Input 
                                            placeholder="P-000..." 
                                            value={packingNumber}
                                            onChange={(e) => setPackingNumber(e.target.value)}
                                            className="h-7 text-xs w-28 bg-white border-emerald-200"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <Label className="text-[10px] text-emerald-700 font-bold uppercase">Valor Packing</Label>
                                        <Input 
                                            type="number"
                                            placeholder="0.00" 
                                            value={packingTotal || ''}
                                            onChange={(e) => setPackingTotal(parseFloat(e.target.value) || 0)}
                                            className="h-7 text-xs w-24 bg-white border-emerald-200 text-right font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => moveToPending(selectedOrders.map(o => o.order.id))}
                                        className="text-red-500 border-red-200 hover:bg-red-50 h-8 text-[10px]"
                                    >
                                        Limpiar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveRequest}
                                        disabled={selectedOrders.length === 0 || saveBatch.isPending}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 text-[10px] px-3 font-bold"
                                    >
                                        {saveBatch.isPending ? "Guardando..." : "Confirmar Recepción"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0 relative">
                        <SelectedOrdersTable
                            orders={selectedOrders}
                            onRemove={moveToPending}
                            onUpdateInvoiceTotal={updateInvoiceTotal}
                            onUpdateInvoiceNumber={updateInvoiceNumber}
                            onUpdateDocumentType={updateDocumentType}
                            onUpdateEntryDate={updateEntryDate}
                        />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 overflow-hidden data-[state=inactive]:hidden h-full flex flex-col min-h-0">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col overflow-hidden">
                        <ReceptionHistory orders={allOrders} clients={clients} />
                    </div>
                </TabsContent>
            </Tabs>

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Confirmar Recepción</DialogTitle>
                        <DialogDescription className="pt-2">
                            Se procesarán <strong>{selectedOrders.length} pedidos</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Financial Summary */}
                        <div className="p-4 bg-slate-50 rounded-md space-y-2 text-sm border">
                            <div className="flex justify-between">
                                <span>Total Facturas:</span>
                                <span className="font-bold">${totalInvoices.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-blue-600">
                                <span>Abonado Previamente:</span>
                                <span className="font-bold">${totalPrevPaid.toFixed(2)}</span>
                            </div>
                            <div className="pt-2 border-t flex justify-between font-bold text-slate-800">
                                <span>Saldo Restante Global:</span>
                                <span>${globalRemaining.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Details - Only show if there are payments to register */}
                        <p className="text-xs text-muted-foreground">
                            Se generarán etiquetas PDF y se actualizarán los saldos.
                            <br />Si se generan saldos a favor, se crearán los créditos automáticamente.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={confirmSave}
                            disabled={saveBatch.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saveBatch.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function Spinner({ label }: { label: string }) {
    return (
        <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-muted-foreground">{label}</p>
        </div>
    )
}
