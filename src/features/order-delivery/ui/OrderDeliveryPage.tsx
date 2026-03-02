import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderDeliveryList } from "../model/useOrderDelivery"
import type { DeliveryFilters } from "../model/useOrderDelivery"
import { OrderDeliveryTable } from "./OrderDeliveryTable"
import { DeliverOrderModal } from "./DeliverOrderModal"
import type { Order } from "@/entities/order/model/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { History, Truck } from "lucide-react"
import { useAuth } from "@/shared/auth"
import { useToast } from "@/shared/ui/use-toast"
import { PageHeader } from "@/shared/ui/PageHeader"
import { cn } from "@/shared/lib/utils"

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
        <div className="space-y-4">
            <PageHeader
                title="Entrega al Cliente"
                description="Gestión de entregas y cobro de saldos bancarios."
                icon={Truck}
                searchQuery={filters.searchText || ""}
                onSearchChange={(val) => setFilters(prev => ({ ...prev, searchText: val }))}
                actions={
                    <Button variant="outline" onClick={() => navigate('/orders/delivery/history')} className="gap-2">
                        <History className="h-4 w-4" />
                        Historial de Entregas
                    </Button>
                }
            />

            {/* Filters Bar (Dates) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="w-full md:w-40">
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Desde (Recepción)</label>
                    <Input
                        type="date"
                        className="bg-slate-50 border-slate-200"
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Hasta (Recepción)</label>
                    <Input
                        type="date"
                        className="bg-slate-50 border-slate-200"
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                </div>
            </div>

            {/* Legend / Category Filters */}
            <div className="flex flex-wrap gap-3 text-xs mb-2">
                <button
                    onClick={() => setDateCategoryFilter('ALL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 font-bold ${dateCategoryFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                    <span>Todos</span>
                </button>
                <button
                    onClick={() => setDateCategoryFilter(prev => prev === 'RECENT' ? 'ALL' : 'RECENT')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 font-bold ${dateCategoryFilter === 'RECENT' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50'}`}
                >
                    <div className={cn("w-2 h-2 rounded-full", dateCategoryFilter === 'RECENT' ? 'bg-white' : 'bg-emerald-500')}></div>
                    <span>Reciente (&lt; 5 días)</span>
                </button>
                <button
                    onClick={() => setDateCategoryFilter(prev => prev === 'WARN' ? 'ALL' : 'WARN')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 font-bold ${dateCategoryFilter === 'WARN' ? 'bg-amber-500 text-white border-amber-500 shadow-md transform scale-105' : 'bg-white text-amber-700 border-amber-100 hover:bg-amber-50'}`}
                >
                    <div className={cn("w-2 h-2 rounded-full", dateCategoryFilter === 'WARN' ? 'bg-white' : 'bg-amber-500')}></div>
                    <span>En bodega &gt; 5 días</span>
                </button>
                <button
                    onClick={() => setDateCategoryFilter(prev => prev === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 font-bold ${dateCategoryFilter === 'CRITICAL' ? 'bg-red-600 text-white border-red-600 shadow-md transform scale-105' : 'bg-white text-red-700 border-red-100 hover:bg-red-50'}`}
                >
                    <div className={cn("w-2 h-2 rounded-full", dateCategoryFilter === 'CRITICAL' ? 'bg-white' : 'bg-red-500')}></div>
                    <span>Crítico &gt; 15 días</span>
                </button>
            </div>

            <div className="flex items-center justify-between pt-6 pb-2">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1.5 rounded-full bg-monchito-purple" />
                    <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase text-[13px] tracking-widest font-monchito">
                        Pedidos Listos para Entrega
                    </h2>
                </div>
                <span className="text-xs font-medium text-slate-400">{displayedOrders.length} registros encontrados</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
