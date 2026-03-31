import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { PackageCheck, RotateCcw } from "lucide-react" // Added RotateCcw
import type { Order } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { cn } from "@/shared/lib/utils"

interface OrderReceptionTableProps {
    orders: Order[]
    onReceive: (order: Order) => void
    onReverse?: (orderId: string) => void // Added onReverse
    isProcessing?: string | null
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-EC', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

function formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
}

export function OrderReceptionTable({ orders, onReceive, onReverse, isProcessing }: OrderReceptionTableProps) {
    return (
        <div className="rounded-3xl border border-monchito-purple/10 bg-white/50 backdrop-blur-sm overflow-hidden shadow-2xl premium-shadow">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)] min-h-[400px] custom-scrollbar px-1">
                <Table className="min-w-[1000px] border-collapse">
                    <TableHeader className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-[0.2em] px-6 py-6 font-display">Fecha</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-[0.2em] px-6 py-6 font-display">N° Recibo</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-[0.2em] px-6 py-6 font-display">Cliente</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-[0.2em] px-6 py-6 font-display">Producto</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-[0.2em] px-6 py-6 font-display text-right font-display">Valor Estimado</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-[0.2em] px-6 py-6 font-display text-right font-display">Abonado</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-[0.2em] px-6 py-6 font-display text-right font-display">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                        <TableBody className="divide-y divide-monchito-purple/5 stagger-in">
                            {orders.length === 0 ? (
                                <TableRow className="border-b border-monchito-purple/5">
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-400 font-medium">
                                        No hay pedidos para procesar en esta sección.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id} className={cn(
                                        "border-b border-monchito-purple/5 hover:bg-monchito-purple/5 transition-all duration-500",
                                        order.status === 'RECIBIDO_EN_BODEGA' ? 'bg-monchito-purple/[0.03]' : ''
                                    )}>
                                <TableCell>{formatDate(order.createdAt)}</TableCell>
                                <TableCell className="font-medium">
                                    {order.receiptNumber}
                                    {order.orderNumber && (
                                        <span className="block text-[10px] text-muted-foreground">
                                            N°: {order.orderNumber}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>{order.clientName}</TableCell>
                                <TableCell>{order.brandName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(getPaidAmount(order))}</TableCell>
                                <TableCell className="text-right px-6 py-4">
                                    <div className="flex justify-end gap-2">
                                        {order.status === 'RECIBIDO_EN_BODEGA' ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-all duration-300 font-bold"
                                                onClick={() => onReverse?.(order.id)}
                                                disabled={isProcessing === order.id}
                                                title="Regresar Recepción"
                                            >
                                                <RotateCcw className={`mr-2 h-3.5 w-3.5 ${isProcessing === order.id ? 'animate-spin' : ''}`} />
                                                Regresar
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/10 transition-all duration-300 font-bold"
                                                onClick={() => onReceive(order)}
                                                disabled={isProcessing === order.id}
                                            >
                                                <PackageCheck className="mr-2 h-3.5 w-3.5" />
                                                Recibir
                                            </Button>
                                        )}
                                    </div>
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
