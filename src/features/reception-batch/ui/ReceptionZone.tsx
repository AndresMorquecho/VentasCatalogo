import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { SelectedOrdersTable } from "./SelectedOrdersTable"
import { ArrowDown, CheckCircle } from "lucide-react"


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
    const handleMainKeyDown = (e: React.KeyboardEvent, group: string, index: number) => {
        const input = e.currentTarget as HTMLInputElement;
        const isInput = input.tagName === 'INPUT';
        const isNumber = isInput && input.type === 'number';
        const isDate = isInput && input.type === 'date';
        
        let selectionStart: number | null = null;
        let valueLength = 0;

        try {
            if (isInput && !isNumber && !isDate) {
                selectionStart = input.selectionStart;
                valueLength = input.value.length;
            }
        } catch (err) {}

        if (e.key === 'ArrowRight') {
            const isAtEnd = !isInput || isDate || selectionStart === valueLength;
            if (isAtEnd) {
                const next = document.querySelector(`[data-nav-group="${group}"][data-nav-index="${index + 1}"]`) as HTMLElement;
                if (next) {
                    e.preventDefault();
                    next.focus();
                    if (next instanceof HTMLInputElement && next.type !== 'number' && next.type !== 'date') next.select();
                }
            }
        } else if (e.key === 'ArrowLeft') {
            const isAtStart = !isInput || isDate || selectionStart === 0;
            if (isAtStart) {
                const prev = document.querySelector(`[data-nav-group="${group}"][data-nav-index="${index - 1}"]`) as HTMLElement;
                if (prev) {
                    e.preventDefault();
                    prev.focus();
                    if (prev instanceof HTMLInputElement && prev.type !== 'number' && prev.type !== 'date') prev.select();
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const table = document.querySelector('table');
            if (table) {
                const firstInput = table.querySelector('input, select, button') as HTMLElement;
                if (firstInput) firstInput.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Jump to something above or just ignore
        } else if (e.key === 'Enter') {
             // In these specific fields, Enter might finalilze the batch
             if (index === 2) {
                 e.preventDefault();
                 onConfirm();
             }
        }
    };

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
                                    data-nav-group="batch-header"
                                    data-nav-index={0}
                                    onKeyDown={(e) => handleMainKeyDown(e, 'batch-header', 0)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] text-monchito-purple font-black uppercase tracking-widest">Valor Packing ($)</Label>
                                <Input 
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00" 
                                    value={packingTotal}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        setPackingTotal(Number(val));
                                    }}
                                    className="h-8 text-xs w-28 bg-white border-monchito-purple/20 focus:ring-monchito-purple/20 font-mono font-bold text-monchito-purple hide-spinner"
                                    data-nav-group="batch-header"
                                    data-nav-index={1}
                                    onKeyDown={(e) => handleMainKeyDown(e, 'batch-header', 1)}
                                />
                            </div>
                        </div>

                        <Button 
                            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold h-9 px-6 shadow-sm flex items-center gap-2"
                            disabled={selectedOrders.length === 0 || isProcessing || !packingNumber}
                            onClick={onConfirm}
                            data-nav-group="batch-header"
                            data-nav-index={2}
                            onKeyDown={(e) => handleMainKeyDown(e, 'batch-header', 2)}
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
                            entryDate: (o as any).entryDate || new Date().toISOString().split('T')[0]
                        }))}
                        onRemove={(ids) => onRemove(ids[0])}
                        onUpdateInvoiceTotal={(id, val) => onUpdateOrder(id, { finalTotal: val })}
                        onUpdateInvoiceNumber={(id, val) => onUpdateOrder(id, { finalInvoiceNumber: val })}
                        onUpdateDocumentType={(id, val) => onUpdateOrder(id, { documentType: val })}
                        onUpdateEntryDate={(id, val) => onUpdateOrder(id, { entryDate: val })}
                    />
                </div>
            </div>
        </div>
    )
}
