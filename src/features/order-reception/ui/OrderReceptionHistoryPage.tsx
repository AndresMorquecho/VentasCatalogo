import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderReceptionHistory } from "../model/useOrderReception"
import type { ReceptionFilters } from "../model/useOrderReception"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, Search, RotateCcw } from "lucide-react"
import { orderApi } from "@/entities/order/model/api"
import { useToast } from "@/shared/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"

export function OrderReceptionHistoryPage() {
    const [filters, setFilters] = useState<ReceptionFilters>({})
    const { data: orders = [], isLoading } = useOrderReceptionHistory(filters)
    const navigate = useNavigate()
    const { showToast } = useToast()
    const qc = useQueryClient()
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    function formatDate(date: string) {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('es-EC', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    function formatCurrency(amount: number) {
        return `$${amount.toFixed(2)}`
    }

    const handleReverseReception = async (orderId: string) => {
        if (!confirm('¿Está seguro de regresar la recepción de este pedido? Se revertirán los abonos asociados y el estado volverá a "POR RECIBIR".')) return

        setIsProcessing(orderId)
        try {
            await orderApi.reverseReception(orderId)
            showToast("El pedido ha vuelto al estado pendiente de recepción.", "success")
            await qc.invalidateQueries({ queryKey: ['orders'] })
            await qc.invalidateQueries({ queryKey: ['receptionHistory'] })
        } catch (error) {
            showToast(error instanceof Error ? error.message : "No se pudo regresar la recepción", "error")
        } finally {
            setIsProcessing(null)
        }
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 pl-0 hover:bg-transparent hover:text-amber-700">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Recepción
                </Button>
                <h1 className="text-2xl font-bold text-amber-900 border-b pb-4 border-amber-200">
                    Historial de Recepciones
                </h1>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6 flex flex-wrap gap-4 items-end">
                <div className="w-full md:w-64">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cliente, Recibo, Factura..."
                            className="pl-9"
                            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde (Recepción)</label>
                    <Input type="date" onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta (Recepción)</label>
                    <Input type="date" onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-amber-50/50">
                        <TableRow>
                            <TableHead>Fecha Recepción</TableHead>
                            <TableHead>N° Recibo</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>N° Factura</TableHead>
                            <TableHead className="text-right">Valor Estimado</TableHead>
                            <TableHead className="text-right">Valor Real</TableHead>
                            <TableHead className="text-center">Estado Actual</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No se encontraron registros.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-amber-900">
                                        {formatDate(order.receptionDate!)}
                                    </TableCell>
                                    <TableCell>{order.receiptNumber}</TableCell>
                                    <TableCell>{order.clientName}</TableCell>
                                    <TableCell className="font-mono text-xs">{order.invoiceNumber || '-'}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {formatCurrency(order.total)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(order.realInvoiceTotal || order.total)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${order.status === 'RECIBIDO_EN_BODEGA'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {order.status === 'RECIBIDO_EN_BODEGA' ? 'En Bodega' : 'Entregado'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {order.status === 'RECIBIDO_EN_BODEGA' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleReverseReception(order.id)}
                                                disabled={isProcessing === order.id}
                                                className="text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                                                title="Regresar recepción"
                                            >
                                                <RotateCcw className={`h-4 w-4 ${isProcessing === order.id ? 'animate-spin' : ''}`} />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
