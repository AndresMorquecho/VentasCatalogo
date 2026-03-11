import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Input } from "@/shared/ui/input"
import type { SelectedOrderState } from "../model/useReceptionBatch"
import { X, CheckCircle, AlertCircle } from "lucide-react"


interface Props {
    orders: SelectedOrderState[]
    onRemove: (ids: string[]) => void
    onUpdateInvoiceTotal: (id: string, val: number) => void
    onUpdateInvoiceNumber: (id: string, val: string) => void
    onUpdateDocumentType: (id: string, val: string) => void
    onUpdateEntryDate: (id: string, val: string) => void
}

export function SelectedOrdersTable({
    orders,
    onRemove,
    onUpdateInvoiceTotal,
    onUpdateInvoiceNumber,
    onUpdateDocumentType,
    onUpdateEntryDate
}: Props) {
    const totalEstimate = orders.reduce((sum, o) => sum + o.order.total, 0)
    const totalInvoice = orders.reduce((sum, o) => sum + o.finalTotal, 0)
    // const totalAbono = orders.reduce((sum, o) => sum + (o.abonoRecepcion || 0), 0)

    if (orders.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-200 rounded-lg bg-emerald-50 text-emerald-400">
                <p>Selecciona pedidos para recibir...</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 h-full flex flex-col">


            <div className="border rounded-md overflow-hidden flex-1 flex flex-col bg-white shadow-sm ring-1 ring-emerald-100/50">
                <div className="flex-1 overflow-auto">
                    <Table className="min-w-[1300px] w-full">
                        <TableHeader className="bg-emerald-50 sticky top-0 z-10 shadow-sm">
                            <TableRow className="h-8 border-b border-emerald-100">
                                <TableHead className="w-[30px] p-1 bg-emerald-50 text-center">#</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Recibo</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Empresaria</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">N° de pedido</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Catálogo</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal text-right">Valor pedido</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs font-medium text-blue-700 text-right">Abono</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Tipo documento</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Factura</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs font-bold text-emerald-800 text-right">Valor factura</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs text-muted-foreground font-normal">Fecha ingreso</TableHead>
                                <TableHead className="py-1 px-2 whitespace-nowrap text-xs font-bold text-slate-800 text-right">Saldo</TableHead>
                                <TableHead className="w-[30px] p-1 bg-emerald-50"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map(({ order, finalTotal, finalInvoiceNumber, documentType, entryDate }) => {
                                const initialPaid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
                                
                                // Current pending based on actual invoice value vs initial paid
                                const finalBalance = finalTotal - initialPaid;

                                const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}`;
                                
                                // Highlight if Estimate doesn't match Real
                                const mismatch = Math.abs(order.total - finalTotal) > 0.01;

                                return (
                                    <TableRow key={order.id} className={`group hover:bg-emerald-50/20 transition-colors h-10 border-b border-slate-100 ${mismatch ? 'bg-amber-50/30' : ''}`}>
                                        <TableCell className="p-1 w-[30px] text-center">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                                        </TableCell>
                                        <TableCell className="py-1 px-2 font-mono text-xs">#{order.receiptNumber}</TableCell>
                                        <TableCell className="py-1 px-2 text-xs font-medium">{order.clientName}</TableCell>
                                        <TableCell className="py-1 px-2 text-xs">{order.orderNumber || '---'}</TableCell>
                                        <TableCell className="py-1 px-2 text-xs">{order.brandName}</TableCell>
                                        
                                        {/* Valor Pedido (Esimated) */}
                                        <TableCell className="py-1 px-2 text-right font-mono text-xs">${order.total.toFixed(2)}</TableCell>

                                        {/* Abono Anterior (Read Only) */}
                                        <TableCell className="py-1 px-2 text-right font-mono text-xs text-blue-600">
                                            ${initialPaid.toFixed(2)}
                                        </TableCell>

                                        {/* Document Type */}
                                        <TableCell className="py-1 px-2">
                                            <select
                                                value={documentType}
                                                onChange={(e) => onUpdateDocumentType(order.id, e.target.value)}
                                                className="h-7 text-[10px] w-24 bg-white border border-slate-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            >
                                                <option value="FACTURA">FACTURA</option>
                                                <option value="TICKET">TICKET</option>
                                                <option value="GUIA">GUÍA</option>
                                                <option value="OTROS">OTROS</option>
                                            </select>
                                        </TableCell>

                                        {/* Invoice Number */}
                                        <TableCell className="py-1 px-2">
                                            <Input
                                                value={finalInvoiceNumber}
                                                onChange={(e) => onUpdateInvoiceNumber(order.id, e.target.value)}
                                                className="h-7 text-xs bg-white border-slate-200 px-2 min-w-[80px]"
                                                placeholder="#"
                                            />
                                        </TableCell>

                                        {/* Valor Factura (Real) */}
                                        <TableCell className="py-1 px-2">
                                            <Input
                                                type="number"
                                                min={0}
                                                value={finalTotal}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    onUpdateInvoiceTotal(order.id, isNaN(val) ? 0 : val);
                                                }}
                                                className={`h-7 text-xs px-2 text-right font-mono bg-white border-emerald-200 focus:ring-emerald-500 font-bold ${mismatch ? 'text-amber-700 bg-amber-50' : 'text-emerald-700'}`}
                                            />
                                        </TableCell>

                                        {/* Fecha Ingreso */}
                                        <TableCell className="py-1 px-2">
                                            <Input
                                                type="date"
                                                value={entryDate}
                                                onChange={(e) => onUpdateEntryDate(order.id, e.target.value)}
                                                className="h-7 text-[10px] px-1 w-28 bg-white border-slate-200"
                                            />
                                        </TableCell>

                                        {/* Final Saldo */}
                                        <TableCell className={`py-1 px-2 text-right font-mono font-bold text-xs`}>
                                            <span className={finalBalance < -0.01 ? 'text-emerald-600' : finalBalance > 0.01 ? 'text-amber-600' : 'text-slate-400'}>
                                                {finalBalance < -0.01 ? 'Favor: ' : ''}{fmt(finalBalance)}
                                            </span>
                                        </TableCell>

                                        <TableCell className="p-1 w-[30px] text-center">
                                            <button
                                                onClick={() => onRemove([order.id])}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                {/* Summary Footer */}
                <div className="bg-emerald-50/50 border-t p-2 flex justify-end gap-12 pr-16 shrink-0 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Total Pedidos:</span>
                        <span className="font-mono font-medium text-amber-700">${totalEstimate.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Total Packing (Facturas):</span>
                        <span className="font-mono font-bold text-emerald-800">${totalInvoice.toFixed(2)}</span>
                    </div>
                    {Math.abs(totalEstimate - totalInvoice) > 0.01 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 rounded text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-bold">Diferencia: ${Math.abs(totalEstimate - totalInvoice).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
