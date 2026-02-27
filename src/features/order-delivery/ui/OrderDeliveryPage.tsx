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
    const [dateCategoryFilter, setDateCategoryFilter] = useState<'ALL' | 'RECENT' | 'WARN' | 'CRITICAL'>('ALL')
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

    const displayedOrders = orders.filter(order => {
        const now = new Date();
        const reception = order.receptionDate ? new Date(order.receptionDate) : new Date(order.createdAt);
        const diffTime = now.getTime() - reception.getTime();
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (dateCategoryFilter === 'RECENT' && days > 5) return false;
        if (dateCategoryFilter === 'WARN' && (days <= 5 || days > 15)) return false;
        if (dateCategoryFilter === 'CRITICAL' && days <= 15) return false;

        return true;
    });

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b pb-4 border-green-200">
                <div className="space-y-1 sm:space-y-2 px-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Entrega al Cliente
                    </h1>
                    <h2 className="text-base font-medium text-muted-foreground tracking-tight">Gestión de entregas y cobro de saldos</h2>
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

            {/* Legend / Filters */}
            <div className="flex flex-wrap gap-3 text-xs mb-4 px-1">
                <button
                    onClick={() => setDateCategoryFilter(prev => prev === 'ALL' ? 'ALL' : 'ALL')} // Just forcing ALL or toggle
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${dateCategoryFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                    <span className="font-medium">Todos</span>
                </button>
                <button
                    onClick={() => setDateCategoryFilter(prev => prev === 'RECENT' ? 'ALL' : 'RECENT')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${dateCategoryFilter === 'RECENT' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                    <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-full"></div>
                    <span className="font-medium">Reciente (&lt; 5 días)</span>
                </button>
                <button
                    onClick={() => setDateCategoryFilter(prev => prev === 'WARN' ? 'ALL' : 'WARN')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${dateCategoryFilter === 'WARN' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                >
                    <div className="w-3 h-3 bg-amber-400 border border-amber-500 rounded-full"></div>
                    <span className="font-medium">En bodega &gt; 5 días</span>
                </button>
                <button
                    onClick={() => setDateCategoryFilter(prev => prev === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${dateCategoryFilter === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                >
                    <div className="w-3 h-3 bg-red-400 border border-red-500 rounded-full"></div>
                    <span className="font-medium">Crítico &gt; 15 días</span>
                </button>
            </div>

            <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <OrderDeliveryTable orders={displayedOrders} onDeliver={handleDeliver} />
            </div>

            <DeliverOrderModal
                order={selectedOrder}
                open={isDeliverModalOpen}
                onOpenChange={setIsDeliverModalOpen}
            />
        </div>
    )
}
