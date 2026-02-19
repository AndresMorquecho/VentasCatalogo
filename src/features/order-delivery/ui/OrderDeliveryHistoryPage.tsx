import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderDeliveryHistory } from "../model/useOrderDelivery"
import type { DeliveryFilters } from "../model/useOrderDelivery"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, Search, Printer } from "lucide-react"
import { generateDeliveryReceipt } from "../lib/generateDeliveryReceipt"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"

export function OrderDeliveryHistoryPage() {
    const [filters, setFilters] = useState<DeliveryFilters>({})
    const { data: orders = [], isLoading } = useOrderDeliveryHistory(filters)
    const navigate = useNavigate()

    function formatDate(date: string) {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('es-EC', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    function formatCurrency(amount: number) {
        return `$${amount.toFixed(2)}`
    }

    function calculateDaysInWarehouse(order: any) {
        if (!order.receptionDate || !order.deliveryDate) return '-'
        const start = new Date(order.receptionDate).getTime()
        const end = new Date(order.deliveryDate).getTime()
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        return `${diff} días`
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 pl-0 hover:bg-transparent hover:text-green-700">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Entregas
                </Button>
                <h1 className="text-2xl font-bold text-green-900 border-b pb-4 border-green-200">
                    Historial de Entregas
                </h1>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6 flex flex-wrap gap-4 items-end">
                <div className="w-full md:w-64">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cliente, Recibo..."
                            className="pl-9"
                            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde (Entrega)</label>
                    <Input type="date" onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta (Entrega)</label>
                    <Input type="date" onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha Entrega</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>N° Recibo</TableHead>
                            <TableHead className="text-right">Total Real</TableHead>
                            <TableHead className="text-center">Tiempo en Bodega</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No se encontraron registros.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-green-900">
                                        {formatDate(order.deliveryDate!)}
                                    </TableCell>
                                    <TableCell>{order.clientName}</TableCell>
                                    <TableCell>{order.receiptNumber}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(order.realInvoiceTotal || order.total)}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                        {calculateDaysInWarehouse(order)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                            Entregado
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Imprimir Comprobante"
                                            onClick={() => generateDeliveryReceipt(order, {
                                                amountPaidNow: 0,
                                                method: order.paymentMethod || 'N/A',
                                                user: 'Sistema'
                                            })}
                                        >
                                            <Printer className="h-4 w-4 text-slate-500 hover:text-green-600" />
                                        </Button>
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
