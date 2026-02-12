import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderReceptionList } from "../model/useOrderReception"
import type { ReceptionFilters } from "../model/useOrderReception"
import { OrderReceptionTable } from "./OrderReceptionTable"
import { ReceiveOrderModal } from "./ReceiveOrderModal"
import type { Order } from "@/entities/order/model/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, History } from "lucide-react"

export function OrderReceptionPage() {
    const [filters, setFilters] = useState<ReceptionFilters>({})
    const { data: orders = [], isLoading, isError } = useOrderReceptionList(filters)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
    const navigate = useNavigate()

    const handleReceive = (order: Order) => {
        setSelectedOrder(order)
        setIsReceiveModalOpen(true)
    }

    if (isLoading) return <div className="p-8">Cargando pedidos...</div>
    if (isError) return <div className="p-8 text-red-500">Error al cargar pedidos.</div>

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b pb-4 border-amber-200">
                <div>
                    <h1 className="text-3xl font-bold text-amber-900">
                        Recepción en Bodega
                    </h1>
                    <p className="text-amber-700 text-sm mt-1">Gestión de llegada de pedidos y ajuste de facturación</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/orders/reception/history')} className="gap-2">
                    <History className="h-4 w-4" />
                    Historial de Recepciones
                </Button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6 flex flex-wrap gap-4 items-end">
                <div className="w-full md:w-64">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar (Cliente/Recibo)</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9"
                            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde (Entrega)</label>
                    <Input
                        type="date"
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta (Entrega)</label>
                    <Input
                        type="date"
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                </div>
                {/* Brand select placeholder - could be populated */}
            </div>

            <div className="bg-amber-50/50 rounded-lg p-1 border border-amber-100">
                <OrderReceptionTable orders={orders} onReceive={handleReceive} />
            </div>

            <ReceiveOrderModal
                order={selectedOrder}
                open={isReceiveModalOpen}
                onOpenChange={setIsReceiveModalOpen}
            />
        </div>
    )
}
