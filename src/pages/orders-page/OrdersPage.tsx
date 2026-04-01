import { OrderList } from "@/features/order-management"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Inbox, Plus, FileDown, Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useState } from "react"
import { useOrderList } from "@/entities/order/model/hooks"
import { useDebounce } from "@/shared/lib/hooks"
import { startOfDay, endOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"
import { exportOrdersToExcel } from "@/shared/lib/exportExcel"
import type { OrderFilterType } from "@/features/order-management/model/useOrderFilters"

export default function OrdersPage() {
    const [triggerCreate, setTriggerCreate] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    // Center filtering logic here to share with export
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebounce(searchQuery, 1000)
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const debouncedDateRange = useDebounce(dateRange, 500)

    const [statusFilter, setStatusFilter] = useState<OrderFilterType>('ALL')

    // Data for Full Export
    const { refetch: fetchFullData } = useOrderList({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        startDate: debouncedDateRange?.from ? startOfDay(debouncedDateRange.from).toISOString() : undefined,
        endDate: debouncedDateRange?.to ? endOfDay(debouncedDateRange.to).toISOString() : undefined,
        onlyParents: true,
        limit: 2000 // High limit for export
    })

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const { data } = await fetchFullData()
            const responseData = data as any;
            const ordersToExport = responseData ? (Array.isArray(responseData) ? responseData : (responseData.data || [])) : []
            
            if (ordersToExport.length === 0) {
                alert("No hay pedidos para exportar con estos filtros")
                return
            }
            
            exportOrdersToExcel(ordersToExport, `Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`)
        } catch (error) {
            console.error("Error exporting excel:", error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Pedidos" 
                description="Listado de pedidos"
                icon={Inbox}
                actions={
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="bg-white hover:bg-emerald-50 hover:text-emerald-700 border-slate-200"
                        >
                            {isExporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="mr-2 h-4 w-4 text-emerald-600" />
                            )}
                            Exportar a Excel
                        </Button>
                        <Button onClick={() => setTriggerCreate(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
                        </Button>
                    </div>
                }
            />
            <OrderList 
                triggerCreate={triggerCreate} 
                onTriggerHandled={() => setTriggerCreate(false)}
                externalFilters={{
                    searchQuery,
                    setSearchQuery,
                    debouncedSearch,
                    dateRange,
                    setDateRange,
                    debouncedDateRange,
                    statusFilter,
                    setStatusFilter: (f: any) => setStatusFilter(f)
                }}
            />
        </div>
    )
}
