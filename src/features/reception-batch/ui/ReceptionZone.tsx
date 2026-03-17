import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { SelectedOrdersTable } from "./SelectedOrdersTable"
import { ArrowDown, CheckCircle } from "lucide-react"
import type { CreditDistribution } from "@/entities/financial-record/model/types"

interface Props {
    selectedOrders: any[]
    onRemove: (id: string) => void
    onConfirm: () => void
    isProcessing: boolean
    packingNumber: string
    packingTotal: number
    setPackingNumber: (val: string) => void
    setPackingTotal: (val: number) => void
    onUpdateOrder: (id: string, data: any) => void
    isEditing?: boolean
}

export function ReceptionZone({
    selectedOrders,
    onRemove,
    onConfirm,
    isProcessing,
    packingNumber,
    packingTotal,
    setPackingNumber,
    setPackingTotal,
    onUpdateOrder,
    isEditing = false
}: Props) {
    

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Arrow Indicator */}
            <div className="flex justify-center -my-3 z-10 relative pointer-events-none">
                <div className="bg-white rounded-full p-1 border border-slate-200 shadow-sm text-slate-400">
                    <ArrowDown className="h-4 w-4" />
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
                <div className="p-4 border-b bg-monchito-purple/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-monchito-purple flex items-center gap-2">
                            <span className="bg-monchito-purple/10 text-monchito-purple w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Zona de Recepción
                        </h2>
                        <span className="text-xs font-mono bg-monchito-purple/10 text-monchito-purple px-2 py-0.5 rounded-full font-bold">
                            {selectedOrders.length} {selectedOrders.length === 1 ? 'pedido' : 'pedidos'}
                        </span>
                    </div>

                    <div className="flex flex-1 flex-wrap gap-4 items-center justify-end w-full sm:w-auto">
                        <div className="flex gap-3 items-center">
                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] text-monchito-purple font-black uppercase tracking-widest">N° Packing Empresa</Label>
                                <Input 
                                    placeholder="Ej: P-2024-001" 
                                    value={packingNumber}
                                    onChange={(e) => setPackingNumber(e.target.value)}
                                    className="h-8 text-xs w-32 bg-white border-monchito-purple/20 focus:ring-monchito-purple/20"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] text-monchito-purple font-black uppercase tracking-widest">Valor Packing ($)</Label>
                                <Input 
                                    type="number"
                                    placeholder="0.00" 
                                    value={packingTotal}
                                    onChange={(e) => setPackingTotal(Number(e.target.value))}
                                    className="h-8 text-xs w-28 bg-white border-monchito-purple/20 focus:ring-monchito-purple/20 font-mono font-bold text-monchito-purple"
                                />
                            </div>
                        </div>

                        <Button 
                            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold h-9 px-6 shadow-sm flex items-center gap-2"
                            disabled={selectedOrders.length === 0 || isProcessing || !packingNumber}
                            onClick={onConfirm}
                        >
                            {isProcessing ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            {isEditing ? 'Finalizar Edición de Recepción' : 'Finalizar Recepción'}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden h-80">
                    <SelectedOrdersTable 
                        orders={selectedOrders.map(o => ({
                            order: o,
                            finalTotal: (o as any).finalTotal || o.total,
                            finalInvoiceNumber: (o as any).finalInvoiceNumber || "",
                            documentType: (o as any).documentType || "FACTURA",
                            entryDate: (o as any).entryDate || new Date().toISOString().split('T')[0],
                            creditDistribution: (o as any).creditDistribution // NUEVO: Pasar distribución de crédito
                        }))}
                        onRemove={(ids) => onRemove(ids[0])}
                        onUpdateInvoiceTotal={(id, val) => onUpdateOrder(id, { finalTotal: val })}
                        onUpdateInvoiceNumber={(id, val) => onUpdateOrder(id, { finalInvoiceNumber: val })}
                        onUpdateDocumentType={(id, val) => onUpdateOrder(id, { documentType: val })}
                        onUpdateEntryDate={(id, val) => onUpdateOrder(id, { entryDate: val })}
                        onUpdateCreditDistribution={(id, distribution) => onUpdateOrder(id, { creditDistribution: distribution })} // NUEVO
                    />
                </div>
            </div>
        </div>
    )
}
