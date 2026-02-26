import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderDeliveryList } from "../model/useOrderDelivery"
import type { DeliveryFilters } from "../model/useOrderDelivery"
import { OrderDeliveryTable } from "./OrderDeliveryTable"
import { DeliverOrderModal } from "./DeliverOrderModal"
import type { Order } from "@/entities/order/model/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, History } from "lucide-react"
import { useAuth } from "@/shared/auth"
import { useToast } from "@/shared/ui/use-toast"

export function OrderDeliveryPage() {
    const [filters, setFilters] = useState<DeliveryFilters>({})
    const { data: orders = [], isLoading, isError } = useOrderDeliveryList(filters)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false)
    const navigate = useNavigate()
    const { hasPermission } = useAuth()
    const { showToast } = useToast()

    const handleDeliver = (order: Order) => {
        if (!hasPermission('delivery.confirm')) {
            showToast('No tienes permiso para realizar entregas', 'error')
            return
        }
        setSelectedOrder(order)
        setIsDeliverModalOpen(true)
    }

    if (isLoading) return <div className="p-8">Cargando entregas...</div>
    if (isError) return <div className="p-8 text-red-500">Error al cargar entregas.</div>

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b pb-4 border-green-200">
                <div>
                    <h1 className="text-3xl font-bold text-green-900">
                        Entrega al Cliente
                    </h1>
                    <p className="text-green-700 text-sm mt-1">Gestión de entregas y cobro de saldos</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/orders/delivery/history')} className="gap-2">
                    <History className="h-4 w-4" />
                    Historial de Entregas
                </Button>
            </div>

            {/* Filters Bar */}
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
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde (Recepción)</label>
                    <Input
                        type="date"
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta (Recepción)</label>
                    <Input
                        type="date"
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white border border-slate-200 shadow-sm rounded-sm"></div>
                    <span className="text-slate-600">Reciente (&lt; 5 días)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded-sm"></div>
                    <span className="text-amber-700">En bodega &gt; 5 días</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-50 border border-red-200 rounded-sm"></div>
                    <span className="text-red-700 font-medium">Crítico &gt; 15 días</span>
                </div>
            </div>

            <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <OrderDeliveryTable orders={orders} onDeliver={handleDeliver} />
            </div>

            <DeliverOrderModal
                order={selectedOrder}
                open={isDeliverModalOpen}
                onOpenChange={setIsDeliverModalOpen}
            />
        </div>
    )
}
