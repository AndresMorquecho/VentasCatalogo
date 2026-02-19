import { useState } from "react"
import { useReceptionBatch } from "../model/useReceptionBatch"
import { PendingOrdersTable } from "./PendingOrdersTable"
import { SelectedOrdersTable } from "./SelectedOrdersTable"
import { ReceptionHistory } from "./ReceptionHistory"
import { useToast } from "@/shared/ui/use-toast"
import { generateOrderLabels } from "@/features/order-labels/lib/generateOrderLabels"
import { Loader2, ArrowDown, PackageCheck } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

export function ReceptionBatchPage() {
    const {
        allOrders,
        pendingOrders,
        selectedOrders,
        moveToSelected,
        moveToPending,
        updateAbono,
        updateInvoiceTotal,
        updateInvoiceNumber,
        saveBatch,
        isLoading,
        clients
    } = useReceptionBatch()

    const { showToast } = useToast()
    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleSaveRequest = () => {
        if (selectedOrders.length === 0) return
        setConfirmOpen(true)
    }

    const confirmSave = async () => {
        try {
            const updatedOrders = await saveBatch.mutateAsync(selectedOrders)

            await generateOrderLabels({
                orders: updatedOrders,
                clients: clients,
                user: { name: 'Operador' }
            })

            showToast(`Recepción de ${updatedOrders.length} pedidos procesada exitosamente. Etiquetas generadas.`, "success")
            setConfirmOpen(false)

        } catch (error) {
            console.error("Error en recepción batch:", error)
            showToast("Hubo un error al procesar la recepción.", "error")
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
    const totalAbono = selectedOrders.reduce((acc, o) => acc + o.abonoRecepcion, 0);
    const totalInvoices = selectedOrders.reduce((sum, o) => sum + o.finalTotal, 0);
    const totalPrevPaid = selectedOrders.reduce((sum, o) => sum + (o.order.payments || []).reduce((acc, p) => acc + p.amount, 0), 0);
    const globalRemaining = Math.max(0, totalInvoices - totalPrevPaid - totalAbono);

    return (
        <div className="h-screen bg-slate-50 p-4 flex flex-col gap-4 overflow-hidden">
            <Tabs defaultValue="new" className="flex-1 flex flex-col min-h-0">
                {/* Header Compacto */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-4 px-1">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                            <PackageCheck className="h-6 w-6 text-emerald-600" />
                            Recepción de Pedidos
                        </h1>
                        <p className="text-xs text-slate-500">Gestione la llegada de mercancía y emita etiquetas.</p>
                    </div>

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
                    {/* Top Section: Source (Pending) - Allocating ~50% of vertical space */}
                    <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden shrink-0 h-1/2">
                        <div className="p-3 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                                Pendientes
                            </h2>
                            <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                {pendingOrders.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0 p-0">
                            <PendingOrdersTable orders={pendingOrders} onMove={moveToSelected} clients={clients} />
                        </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex justify-center -my-6 z-10 relative pointer-events-none">
                        <div className="bg-slate-50 rounded-full p-1 border border-slate-200 shadow-sm text-slate-400">
                            <ArrowDown className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Bottom Section: Target (Reception) - Takes remaining space */}
                    <div className="flex-1 flex flex-col bg-white rounded-lg border border-emerald-100 shadow-md ring-1 ring-emerald-500/10 overflow-hidden min-h-0">
                        <div className="p-3 border-b bg-emerald-50/30 flex justify-between items-center shrink-0">
                            <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                                Zona de Recepción
                            </h2>
                            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                {selectedOrders.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0 relative">
                            <SelectedOrdersTable
                                orders={selectedOrders}
                                onRemove={moveToPending}
                                onUpdateAbono={updateAbono}
                                onUpdateInvoiceTotal={updateInvoiceTotal}
                                onUpdateInvoiceNumber={updateInvoiceNumber}
                                onSave={handleSaveRequest}
                                isSaving={saveBatch.isPending}
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Recepción</DialogTitle>
                        <DialogDescription className="pt-2">
                            Se procesarán <strong>{selectedOrders.length} pedidos</strong>.
                            <div className="mt-4 p-4 bg-slate-50 rounded-md space-y-2 text-sm border">
                                <div className="flex justify-between">
                                    <span>Total Facturas:</span>
                                    <span className="font-bold">${totalInvoices.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-blue-600">
                                    <span>Total Abonos a Registrar:</span>
                                    <span className="font-bold">+ ${totalAbono.toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between font-bold text-slate-800">
                                    <span>Saldo Restante Global:</span>
                                    <span>${globalRemaining.toFixed(2)}</span>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-muted-foreground">
                                Se generarán etiquetas PDF y se actualizarán los saldos en Caja General.
                                <br />Si se generan saldos a favor, se crearán los créditos automáticamente.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
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
