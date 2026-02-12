import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { PackageCheck } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { receiveOrder } from "@/entities/order/model/model"

interface ReceiveOrderModalProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReceiveOrderModal({ order, open, onOpenChange }: ReceiveOrderModalProps) {
    const [invoiceTotal, setInvoiceTotal] = useState<string>('')
    const [invoiceNumber, setInvoiceNumber] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const qc = useQueryClient()

    // Reset form when order changes
    useEffect(() => {
        if (order) {
            setInvoiceTotal(order.total.toString())
            setInvoiceNumber('')
        }
    }, [order])

    if (!order) return null

    const handleSubmit = async () => {
        if (!invoiceTotal) return
        const total = parseFloat(invoiceTotal)
        if (isNaN(total) || total <= 0) return

        setIsSubmitting(true)
        try {
            const updatedOrder = receiveOrder(order, total, invoiceNumber)
            await orderApi.update(updatedOrder.id, updatedOrder)
            // Invalidate strictly necessary queries
            await qc.invalidateQueries({ queryKey: ['orders'] })
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (val: number) => `$${val.toFixed(2)}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-900">
                        <PackageCheck className="h-5 w-5" />
                        Recepción en Bodega
                    </DialogTitle>
                    <DialogDescription>
                        Pedido #{order.receiptNumber} - {order.clientName}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoice-total">Valor Real de Factura ($)</Label>
                        <Input
                            id="invoice-total"
                            type="number"
                            value={invoiceTotal}
                            onChange={(e) => setInvoiceTotal(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            className="font-bold text-lg"
                        />
                        <p className="text-xs text-muted-foreground">
                            Valor estimado original: {formatCurrency(order.total)}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="invoice-number">Número de Factura (Opcional)</Label>
                        <Input
                            id="invoice-number"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            placeholder="Ej: 001-002-123456"
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between items-center">
                    <div className="text-xs text-muted-foreground hidden sm:block">
                        Esta acción actualizará el saldo pendiente.
                    </div>
                    <div className="flex gap-2 justify-end w-full sm:w-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !invoiceTotal}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isSubmitting ? 'Guardando...' : 'Confirmar Recepción'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
