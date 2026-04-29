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
import { useAuth } from "@/shared/auth"
import type { OrderFilterType } from "@/features/order-management/model/useOrderFilters"

export default function OrdersPage() {
    const { hasPermission } = useAuth()
    const [triggerCreate, setTriggerCreate] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const debouncedDateRange = useDebounce(dateRange, 500)

    const [statusFilter, setStatusFilter] = useState<OrderFilterType>('ALL')
    
    // Advanced Filters for synchronized Export
    const [clientId, setClientId] = useState<string | undefined>()
    const [brandId, setBrandId] = useState<string | undefined>()
    const [receiptNumber, setReceiptNumber] = useState('')
    const [orderNumber, setOrderNumber] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    const debouncedReceipt = useDebounce(receiptNumber, 500)
    const debouncedOrderNo = useDebounce(orderNumber, 500)

    // Data for Full Export
    const { refetch: fetchFullData } = useOrderList({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        startDate: debouncedDateRange?.from ? startOfDay(debouncedDateRange.from).toISOString() : undefined,
        endDate: debouncedDateRange?.to ? endOfDay(debouncedDateRange.to).toISOString() : undefined,
        clientId,
        brandId,
        receiptNumber: debouncedReceipt || undefined,
        orderNumber: debouncedOrderNo || undefined,
        type: typeFilter === 'ALL' ? undefined : (typeFilter || undefined),
        onlyParents: true,
        limit: 3000 // High limit for export
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
            
            exportOrdersToExcel(
                ordersToExport, 
                `Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`,
                { 
                    brandId,
                    clientId,
                    orderNumber: debouncedOrderNo || undefined
                }
            )
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
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        {hasPermission('orders.export_excel') && (
                            <Button 
                                variant="outline"
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full sm:w-auto bg-white hover:bg-emerald-50 hover:text-emerald-700 border-slate-200"
                            >
                                {isExporting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <FileDown className="mr-2 h-4 w-4 text-emerald-600" />
                                )}
                                Exportar a Excel
                            </Button>
                        )}
                        <Button 
                            onClick={() => setTriggerCreate(true)}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
                        </Button>
                    </div>
                }
            />
            <OrderList 
                triggerCreate={triggerCreate} 
                onTriggerHandled={() => setTriggerCreate(false)}
                externalFilters={{
                    dateRange,
                    setDateRange,
                    debouncedDateRange,
                    statusFilter,
                    setStatusFilter: (f: any) => setStatusFilter(f),
                    clientId,
                    setClientId,
                    brandId,
                    setBrandId,
                    receiptNumber,
                    setReceiptNumber,
                    orderNumber,
                    setOrderNumber,
                    typeFilter,
                    setTypeFilter
                }}
            />
        </div>
    )
}
