import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Printer, X, FileText } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { pdf } from '@react-pdf/renderer'
import { OrderLabelsDocument } from "@/features/order-labels/ui/OrderLabelsDocument"
import { clientApi } from "@/shared/api/clientApi"
import type { Client } from "@/entities/client/model/types"

interface Props {
    isOpen: boolean
    onClose: () => void
    orders: Order[]
}

export function BatchPrintModal({ isOpen, onClose, orders }: Props) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isGenerating, setIsGenerating] = useState(false)
    const [clientsMap, setClientsMap] = useState<Record<string, Client>>({})

    useEffect(() => {
        if (isOpen && orders.length > 0) {
            setSelectedIds(new Set(orders.map(o => o.id)))
            loadClientsData();
        }
    }, [isOpen, orders])

    const loadClientsData = async () => {
        try {
            const clientIds = Array.from(new Set(orders.map(o => o.clientId)));
            const map: Record<string, Client> = {};
            
            await Promise.all(clientIds.map(async (id) => {
                try {
                    const client = await clientApi.getById(id);
                    if (client) map[id] = client;
                } catch (e) {
                    console.error(`Error loading client ${id}`, e);
                }
            }));
            
            setClientsMap(map);
        } catch (error) {
            console.error("Error loading clients for print", error);
        }
    }

    const toggleOrder = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const toggleAll = () => {
        if (selectedIds.size === orders.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(orders.map(o => o.id)))
        }
    }

    const handleGeneratePdf = async () => {
        if (selectedIds.size === 0) return;

        setIsGenerating(true)
        try {
            const selectedOrders = orders.filter(o => selectedIds.has(o.id));
            
            // Create the Document component
            const doc = <OrderLabelsDocument 
                orders={selectedOrders} 
                clientsMap={clientsMap}
                user={{ name: localStorage.getItem('user_name') || 'Admin' }}
            />;

            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `etiquetas-recepcion-${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            onClose();
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-800">
                        <Printer className="h-5 w-5" />
                        Imprimir etiquetas de recepción
                    </DialogTitle>
                </DialogHeader>

                <div className="py-2">
                    <p className="text-sm text-slate-500 mb-4">
                        Selecciona los pedidos para los cuales deseas generar etiquetas de entrega (tickets).
                    </p>

                    <div className="border rounded-lg overflow-hidden border-slate-200">
                        <div className="bg-slate-50 p-2 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    className="accent-emerald-600"
                                    checked={selectedIds.size === orders.length && orders.length > 0}
                                    onChange={toggleAll}
                                />
                                <span className="text-xs font-bold text-slate-600">Seleccionar todos</span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">
                                {selectedIds.size} de {orders.length} seleccionados
                            </span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50/50 sticky top-0 border-b border-slate-100">
                                    <tr>
                                        <th className="p-2 text-left w-10"></th>
                                        <th className="p-2 text-left">Empresaria</th>
                                        <th className="p-2 text-left">Catálogo</th>
                                        <th className="p-2 text-right">Factura</th>
                                        <th className="p-2 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => {
                                        const isSelected = selectedIds.has(o.id);
                                        const total = Number(o.realInvoiceTotal || o.total || 0);
                                        const paid = (o.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                                        const saldo = total - paid;

                                        return (
                                            <tr 
                                                key={o.id} 
                                                className={`border-b border-slate-50 hover:bg-emerald-50/30 cursor-pointer ${isSelected ? 'bg-emerald-50/20' : ''}`}
                                                onClick={() => toggleOrder(o.id)}
                                            >
                                                <td className="p-2 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="accent-emerald-600"
                                                        checked={isSelected}
                                                        onChange={() => {}} // Controlled by row click
                                                    />
                                                </td>
                                                <td className="p-2 font-medium">{o.clientName}</td>
                                                <td className="p-2"><span className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">{o.brandName}</span></td>
                                                <td className="p-2 text-right font-mono">${total.toFixed(2)}</td>
                                                <td className="p-2 text-right font-mono font-bold text-amber-600">${saldo.toFixed(2)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} className="border-slate-200">
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button 
                        onClick={handleGeneratePdf} 
                        disabled={selectedIds.size === 0 || isGenerating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                        {isGenerating ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : (
                            <FileText className="mr-2 h-4 w-4" />
                        )}
                        Generar PDF ({selectedIds.size})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
