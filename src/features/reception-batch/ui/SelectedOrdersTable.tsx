import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { SelectedOrderState } from "../model/useReceptionBatch"
import { X, CheckCircle, Save, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"

interface Props {
    orders: SelectedOrderState[]
    onRemove: (ids: string[]) => void
    onUpdateAbono: (id: string, val: number) => void
    onUpdateInvoiceTotal: (id: string, val: number) => void
    onUpdateInvoiceNumber: (id: string, val: string) => void
    onSave: () => void
    isSaving?: boolean
}

export function SelectedOrdersTable({
    orders,
    onRemove,
    onUpdateAbono,
    onUpdateInvoiceTotal,
    onUpdateInvoiceNumber,
    onSave,
    isSaving
}: Props) {
    const removeAll = () => {
        onRemove(orders.map(o => o.order.id))
    }

    const totalInvoice = orders.reduce((sum, o) => sum + o.finalTotal, 0)
    const totalAbono = orders.reduce((sum, o) => sum + (o.abonoRecepcion || 0), 0)

    if (orders.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                <p>Selecciona pedidos para recibir...</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 sm:px-4 rounded-lg shadow-sm border border-emerald-100 gap-4 shrink-0">
                <div className="flex gap-8 text-sm w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <div>
                        <p className="text-muted-foreground text-xs sm:text-sm font-normal">Total Facturas (Real)</p>
                        <p className="text-lg font-mono font-medium text-emerald-700 leading-none mt-1">${totalInvoice.toFixed(2)}</p>
                    </div>
                    <div className="border-l pl-4 sm:pl-8 border-slate-200">
                        <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm font-normal mb-0.5">
                            <span>Abono a Registrar</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="cursor-help opacity-70 hover:opacity-100 focus:outline-none">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs text-[10px]">Suma total de abonos manuales.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-lg font-mono font-bold text-blue-600 leading-none mt-1">${totalAbono.toFixed(2)}</p>
                    </div>
                </div>

                <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={removeAll}
                        className="text-red-500 border-red-200 hover:bg-red-50 h-9"
                        disabled={isSaving}
                    >
                        Limpiar <X className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:scale-105 active:scale-95 h-8 text-xs px-3"
                    >
                        {isSaving ? "Guardando..." : "Confirmar Recepción"} <Save className="ml-1 h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="border rounded-md overflow-hidden flex-1 bg-white shadow-sm ring-1 ring-emerald-100/50 relative">
                <div className="absolute inset-0 overflow-auto">
                    <Table className="min-w-[1000px] w-full">
                        <TableHeader className="bg-emerald-50 sticky top-0 z-10 shadow-sm">
                            <TableRow className="h-8 border-b border-emerald-100">
                                <TableHead className="w-[30px] p-1 bg-emerald-50"></TableHead>
                                <TableHead className="min-w-[150px] py-1 px-2 bg-emerald-50 text-xs sm:text-sm text-muted-foreground font-normal whitespace-nowrap">Cliente / Item</TableHead>
                                <TableHead className="w-[100px] py-1 px-2 bg-emerald-50 text-xs sm:text-sm text-muted-foreground font-normal whitespace-nowrap">Factura Real #</TableHead>
                                <TableHead className="w-[100px] py-1 px-2 text-right bg-emerald-50 text-xs sm:text-sm text-muted-foreground font-normal whitespace-nowrap">Valor Real</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-emerald-50 text-xs sm:text-sm text-muted-foreground font-normal whitespace-nowrap">Pagado Ant.</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-emerald-100/40 border-l border-emerald-200/50 text-xs sm:text-sm text-muted-foreground font-normal whitespace-nowrap">Saldo Pendiente</TableHead>
                                <TableHead className="w-[100px] py-1 px-2 text-right bg-blue-50/50 text-xs sm:text-sm font-medium text-blue-800 whitespace-nowrap">Abono Hoy</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-emerald-100/60 border-l border-emerald-200 text-xs sm:text-sm font-medium text-emerald-900 whitespace-nowrap">Saldo Final</TableHead>
                                <TableHead className="w-[30px] p-1 bg-emerald-50"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map(({ order, abonoRecepcion, finalTotal, finalInvoiceNumber }) => {
                                const currentPaid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);

                                // Real pending based on inputs
                                const pendingReal = finalTotal - currentPaid;

                                // Final calculation after abono
                                const remainingAfterAbono = pendingReal - abonoRecepcion;

                                // Helper
                                const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}`;

                                // State flags
                                const isCredit = pendingReal < -0.001; // Saldo a Favor inicial
                                const isFullyPaid = Math.abs(pendingReal) < 0.001 && !isCredit;
                                const willGenerateCredit = remainingAfterAbono < -0.001;

                                return (
                                    <TableRow key={order.id} className="group hover:bg-emerald-50/20 transition-colors h-10 border-b border-slate-100">
                                        <TableCell className="p-1 w-[30px] text-center">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                                        </TableCell>
                                        <TableCell className="py-1 px-2">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground text-xs sm:text-sm leading-tight">{order.clientName}</span>
                                                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal flex items-center gap-2">
                                                    <span>Recibo: {order.receiptNumber}</span>
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Invoice Number Input */}
                                        <TableCell className="py-1 px-2">
                                            <Input
                                                value={finalInvoiceNumber}
                                                onChange={(e) => onUpdateInvoiceNumber(order.id, e.target.value)}
                                                className="h-7 text-xs bg-white border-slate-200 px-2"
                                                placeholder="#"
                                            />
                                        </TableCell>

                                        {/* Real Value Input */}
                                        <TableCell className="py-1 px-2">
                                            <Input
                                                type="number"
                                                min={0}
                                                value={finalTotal}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    onUpdateInvoiceTotal(order.id, isNaN(val) ? 0 : val);
                                                }}
                                                className="h-7 text-xs sm:text-sm px-2 text-right font-mono bg-white border-slate-200 focus:ring-emerald-500"
                                            />
                                        </TableCell>

                                        {/* Paid */}
                                        <TableCell className="py-1 px-2 text-right font-mono text-muted-foreground text-xs sm:text-sm font-medium">
                                            {currentPaid > 0 ? (
                                                <span className="text-green-600/80">-{fmt(currentPaid)}</span>
                                            ) : '-'}
                                        </TableCell>

                                        {/* Pending Real */}
                                        <TableCell className={`py-1 px-2 text-right font-mono font-medium bg-emerald-50/20 border-l border-slate-100 text-xs sm:text-sm`}>
                                            {isCredit ? (
                                                <span className="text-emerald-600 bg-emerald-100/50 px-1 rounded inline-block">
                                                    Favor: {fmt(pendingReal)}
                                                </span>
                                            ) : (
                                                <span className={isFullyPaid ? 'text-muted-foreground' : 'text-foreground'}>
                                                    {fmt(pendingReal)}
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Editable Abono */}
                                        <TableCell className="py-1 px-2 bg-blue-50/10">
                                            <Input
                                                type="number"
                                                min={0}
                                                value={abonoRecepcion === 0 ? '' : abonoRecepcion}
                                                placeholder={isCredit ? "-" : "0.00"}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    onUpdateAbono(order.id, isNaN(val) ? 0 : val);
                                                }}
                                                className={`text-right font-mono h-7 text-xs sm:text-sm px-2 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${isCredit ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'bg-white shadow-sm'}`}
                                                disabled={isCredit} // Disabled if credit exists
                                            />
                                            {isCredit && (
                                                <span className="text-[10px] sm:text-xs font-normal text-emerald-600 block text-right mt-0.5">Crédito generado</span>
                                            )}
                                        </TableCell>

                                        {/* Final Result */}
                                        <TableCell className={`py-1 px-2 text-right font-mono font-medium bg-emerald-100/30 border-l border-emerald-100 text-xs sm:text-sm`}>
                                            {willGenerateCredit ? (
                                                <span className="text-emerald-700">Favor: {fmt(remainingAfterAbono)}</span>
                                            ) : (
                                                <span className={Math.abs(remainingAfterAbono) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}>
                                                    {fmt(remainingAfterAbono)}
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="p-1 w-[30px] text-center">
                                            <button
                                                onClick={() => onRemove([order.id])}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                                                title="Quitar de la lista"
                                            >
                                                <X className="h-3.5 w-3.5 mx-auto" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
