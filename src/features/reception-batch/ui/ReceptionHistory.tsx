import { useState, useMemo } from "react"
import { Search, RotateCcw, X, Edit, Trash2, AlertCircle } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { orderApi } from "@/entities/order/model/api"
import { useToast } from "@/shared/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getPendingAmount } from "@/entities/order/model/model"
import type { Client } from "@/entities/client/model/types"

interface Props {
    batches: any[]
    clients: Client[]
    onEdit: (batch: any) => void
    onDelete: (batchId: string) => void
    isDeleting?: boolean
}

export function ReceptionHistory({ batches, onEdit, onDelete, isDeleting }: Props) {
    const [searchTerm, setSearchTerm] = useState("")
    const [dateFilter, setDateFilter] = useState("")
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null)

    const { showToast } = useToast()
    const queryClient = useQueryClient()

    // 1. Filter Logic
    const filteredBatches = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase().trim();
        const targetDate = dateFilter ? new Date(dateFilter).toISOString().split('T')[0] : null;

        return batches.filter(b => {
            let matchesSearch = true;
            if (lowerSearch) {
                const matchesPacking = b.packingNumber.toLowerCase().includes(lowerSearch);
                const matchesOrders = (b.orders || []).some((o: any) => 
                    o.clientName.toLowerCase().includes(lowerSearch) ||
                    o.receiptNumber.toLowerCase().includes(lowerSearch)
                );
                matchesSearch = matchesPacking || matchesOrders;
            }

            let matchesDate = true;
            if (targetDate) {
                const rDate = new Date(b.receptionDate).toISOString().split('T')[0];
                matchesDate = rDate === targetDate;
            }

            return matchesSearch && matchesDate;
        });
    }, [batches, searchTerm, dateFilter]);

    // 2. Reverse Individual Logic (fallback)
    const handleReverseIndividual = async (orderId: string) => {
        setIsProcessing(orderId)
        try {
            await orderApi.reverseReception(orderId)
            showToast("La recepción ha sido revertida correctamente.", "success")
            await queryClient.invalidateQueries({ queryKey: ['orders'] })
            await queryClient.invalidateQueries({ queryKey: ['reception-batches'] });
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al revertir recepción", "error")
        } finally {
            setIsProcessing(null)
        }
    }

    const totalGrandReception = filteredBatches.reduce((sum, b) => sum + Number(b.packingTotal || 0), 0);

    const checkCanModify = (batch: any) => {
        // Can't modify ONLY if ANY order is delivered
        return !batch.orders?.some((o: any) => o.status === 'ENTREGADO');
    };

    return (
        <div className="space-y-4 h-full flex flex-col pt-2">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center shadow-sm">
                <div className="flex gap-2 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar packing, cliente, recibo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="relative w-40">
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    {(searchTerm || dateFilter) && (
                        <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(''); setDateFilter(''); }}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Recepción</p>
                        <p className="text-lg font-mono font-bold text-emerald-700">${totalGrandReception.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="border rounded-md overflow-hidden flex-1 bg-white shadow-sm overflow-y-auto">
                <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="w-[100px]">Fecha</TableHead>
                            <TableHead>N° Packing Empresa</TableHead>
                            <TableHead className="text-center">Cant. Pedidos</TableHead>
                            <TableHead className="text-right">Valor Packing</TableHead>
                            <TableHead className="text-right">Total Facturas</TableHead>
                            <TableHead className="text-right">Diferencia</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBatches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    No se encontraron recepciones.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBatches.map(batch => {
                                const totalInvoices = (batch.orders || []).reduce((sum: number, o: any) => sum + Number(o.realInvoiceTotal || 0), 0);
                                const diff = Number(batch.packingTotal) - totalInvoices;
                                const isExpanded = expandedBatch === batch.id;
                                const canModify = checkCanModify(batch);

                                return (
                                    <>
                                        <TableRow key={batch.id} className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-emerald-50/20' : ''}`}>
                                            <TableCell className="text-xs font-medium" onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                                                {new Date(batch.receptionDate).toLocaleDateString('es-EC')}
                                            </TableCell>
                                            <TableCell onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700">{batch.packingNumber}</span>
                                                    {batch.notes && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{batch.notes}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center" onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {batch.orders?.length || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-emerald-700" onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                                                ${Number(batch.packingTotal).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-600" onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                                                ${totalInvoices.toFixed(2)}
                                            </TableCell>
                                            <TableCell className={`text-right font-mono text-xs ${Math.abs(diff) > 0.1 ? 'text-amber-600 font-bold' : 'text-slate-400'}`} onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                                                ${diff.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={(e) => { e.stopPropagation(); onEdit(batch); }}
                                                        disabled={!canModify}
                                                        title={canModify ? "Editar Packing" : "No se puede editar: Pedidos ya entregados"}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            if (confirm('¿Estás seguro de ELIMINAR todo este packing? Todos los pedidos regresarán a estado PENDIENTE.')) {
                                                                onDelete(batch.id);
                                                            }
                                                        }}
                                                        disabled={!canModify || isDeleting}
                                                        title={canModify ? "Eliminar Packing (Regresar a Pendiente)" : "No se puede eliminar: Pedidos ya entregados"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8"
                                                        onClick={(e) => { e.stopPropagation(); setExpandedBatch(isExpanded ? null : batch.id); }}
                                                    >
                                                        <Search className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {isExpanded && (
                                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
                                                <TableCell colSpan={7} className="p-0">
                                                    <div className="p-4 border-l-4 border-emerald-500 ml-4 mb-4 mt-2 bg-white rounded-r-lg shadow-inner">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h4 className="text-[10px] font-bold text-emerald-700 uppercase">Pedidos asociados al Packing</h4>
                                                            {!canModify && (
                                                                <div className="flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    <span>Este packing tiene pedidos entregados y no puede ser modificado completamente.</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(batch.orders || []).map((order: any) => {
                                                                const pending = getPendingAmount(order);
                                                                const orderCanModify = order.status !== 'ENTREGADO'; // Simple check for individual
                                                                return (
                                                                    <div key={order.id} className="flex justify-between items-center p-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-slate-800">{order.clientName}</span>
                                                                            <span className="text-[10px] text-slate-500 font-mono">Recibo: #{order.receiptNumber} | Factura: {order.invoiceNumber || 'N/A'}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-6">
                                                                            <div className="text-right">
                                                                                <p className="text-[9px] text-slate-400 uppercase">Total Factura</p>
                                                                                <p className="text-xs font-mono font-bold">${Number(order.realInvoiceTotal || order.total).toFixed(2)}</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-[9px] text-slate-400 uppercase">Saldo</p>
                                                                                <p className={`text-xs font-mono font-bold ${pending > 0.01 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                                    ${pending.toFixed(2)}
                                                                                </p>
                                                                            </div>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (confirm(`¿Revertir recepción de ${order.receiptNumber}?`)) {
                                                                                        handleReverseIndividual(order.id);
                                                                                    }
                                                                                }}
                                                                                disabled={isProcessing === order.id || !orderCanModify}
                                                                                title={orderCanModify ? "Regresar Recepción Individual" : "No se puede revertir: Ya fue entregado"}
                                                                            >
                                                                                <RotateCcw className={`h-3.5 w-3.5 ${isProcessing === order.id ? 'animate-spin' : ''}`} />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
