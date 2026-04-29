import { useState, useMemo, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderDeliveryList, useOrderDeliveryFilterData } from "@/features/order-delivery/model/useOrderDelivery"
import type { DeliveryFilters } from "@/features/order-delivery/model/useOrderDelivery"
import { OrderDeliveryTable } from "@/features/order-delivery/ui/OrderDeliveryTable"
import { DeliverOrderModalNew } from "@/features/order-delivery/ui/DeliverOrderModalNew"
import { PendingOrdersModal } from "@/features/order-delivery/ui/PendingOrdersModal"
import type { Order } from "@/entities/order/model/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, History, Truck, RotateCcw, Filter, ChevronDown, PackageOpen, FileDown, Loader2 } from "lucide-react"
import { PageHeader } from "@/shared/ui/PageHeader"
import { orderApi } from "@/entities/order/model/api"
import { exportExchangesToExcel } from "@/shared/lib/exportExcel"
import { useAuth } from "@/shared/auth"
import { useNotifications } from "@/shared/lib/notifications"
import { Pagination } from "@/shared/ui/pagination"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { getPaidAmount } from "@/entities/order/model/model"

/* --- Searchable Select for Clients --- */
function SearchableClientSelect({ 
    onSelect, 
    value,
    clients
}: { 
    onSelect: (clientId: string) => void, 
    value: string,
    clients: any[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const wrapperRef = useRef<HTMLDivElement>(null)

    const selectedClient = clients.find(c => c.id === value)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={wrapperRef}>
            <div 
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm items-center justify-between cursor-pointer hover:border-monchito-purple/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedClient ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
                    {selectedClient ? selectedClient.firstName : "Seleccionar Empresaria..."}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full max-w-[300px] rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in duration-200">
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                autoFocus
                                placeholder="Nombre o Cédula..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-sm rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="max-h-[250px] overflow-auto p-1 py-1.5">
                        <div 
                            className="px-3 py-2 text-sm font-bold text-monchito-purple hover:bg-monchito-purple/5 rounded-lg cursor-pointer flex items-center gap-2"
                            onClick={() => { onSelect(""); setIsOpen(false); }}
                        >
                            Todas las empresarias
                        </div>
                        {clients.filter(c => 
                            c.firstName.toLowerCase().includes(search.toLowerCase()) || 
                            c.identificationNumber?.includes(search)
                        ).length === 0 ? (
                            <div className="px-3 py-4 text-xs text-slate-400 text-center italic">No se encontraron empresarias</div>
                        ) : (
                            clients.filter(c => 
                                c.firstName.toLowerCase().includes(search.toLowerCase()) || 
                                c.identificationNumber?.includes(search)
                            ).map((c) => (
                                <div 
                                    key={c.id}
                                    className={`px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors cursor-pointer rounded-lg flex flex-col ${c.id === value ? "bg-monchito-purple/5 text-monchito-purple" : "text-slate-700"}`}
                                    onClick={() => {
                                        onSelect(c.id)
                                        setIsOpen(false)
                                    }}
                                >
                                    <span className="font-bold">{c.firstName}</span>
                                    <span className="text-[10px] text-slate-400 flex justify-between">
                                        <span>ID: {c.identificationNumber}</span>
                                        <span className="text-monchito-purple font-black">{c.city}</span>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/* --- Searchable Select for Brands --- */
function SearchableBrandSelect({ 
    onSelect, 
    value,
    brands
}: { 
    onSelect: (brandId: string) => void, 
    value: string,
    brands: any[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const wrapperRef = useRef<HTMLDivElement>(null)

    const selectedBrand = brands.find(b => b.id === value)
    
    const filteredBrands = useMemo(() => {
        if (!search) return brands;
        return brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
    }, [brands, search]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={wrapperRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white border-slate-200 h-10 px-4 flex items-center justify-between cursor-pointer text-sm font-bold rounded-xl border focus:ring-2 focus:ring-monchito-purple/20 shadow-sm transition-all"
            >
                <span className={selectedBrand ? "text-slate-900" : "text-slate-400"}>
                    {selectedBrand ? selectedBrand.name : "Todas las marcas"}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-11 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                            <Input 
                                autoFocus
                                placeholder="Buscar marca..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-7 h-8 text-[11px] bg-slate-50 border-none focus-visible:ring-0"
                            />
                        </div>
                    </div>
                    <div className="max-h-[200px] overflow-auto py-1">
                        <div 
                            onClick={() => { onSelect("ALL"); setIsOpen(false); setSearch(""); }}
                            className="px-4 py-2 text-xs font-bold hover:bg-slate-50 cursor-pointer text-slate-400"
                        >
                            Todas las marcas
                        </div>
                        {filteredBrands.map((brand: any) => (
                            <div 
                                key={brand.id}
                                onClick={() => { onSelect(brand.id); setIsOpen(false); setSearch(""); }}
                                className={`px-4 py-2 text-xs font-bold hover:bg-monchito-purple/5 hover:text-monchito-purple cursor-pointer transition-colors ${value === brand.id ? 'bg-monchito-purple/5 text-monchito-purple' : 'text-slate-600'}`}
                            >
                                {brand.name}
                            </div>
                        ))}
                        {filteredBrands.length === 0 && (
                            <div className="px-4 py-3 text-center text-[10px] text-slate-400 italic">No se encontraron marcas</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export function OrderDeliveryPage() {
    const navigate = useNavigate()
    const { hasPermission } = useAuth()
    const { notifyError } = useNotifications()

    // Filter State
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [brandId, setBrandId] = useState<string>("ALL")
    const [clientId, setClientId] = useState<string>("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [orderNumber, setOrderNumber] = useState<string>("")
    const [searchTerm, setSearchTerm] = useState<string>("")
    
    const [showFilters, setShowFilters] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [dateCategoryFilter, setDateCategoryFilter] = useState<'ALL' | 'RECENT' | 'WARN' | 'CRITICAL'>('ALL')

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [brandId, clientId, startDate, endDate, orderNumber, searchTerm, dateCategoryFilter]);

    // Memoized filters for the hook
    const filters = useMemo((): DeliveryFilters => ({
        startDate,
        endDate,
        brandId,
        clientId,
        orderNumber,
        searchText: searchTerm,
        page,
        limit
    }), [startDate, endDate, brandId, clientId, orderNumber, searchTerm, page, limit])

    // Query for filter data (Only ones that HAVE orders to deliver)
    const { data: filterOrdersData } = useOrderDeliveryFilterData()

    // Extract relevant clients and brands from deliverable orders
    const dynamicClients = useMemo(() => {
        if (!filterOrdersData) return []
        const uniques: any[] = []
        const seen = new Set()
        filterOrdersData.forEach((o: any) => {
            if (!seen.has(o.clientId)) {
                uniques.push({ 
                    id: o.clientId, 
                    firstName: o.clientName, 
                    identificationNumber: o.clientIdentification,
                    city: o.clientCity 
                })
                seen.add(o.clientId)
            }
        })
        return uniques.sort((a,b) => a.firstName.localeCompare(b.firstName))
    }, [filterOrdersData])

    const dynamicBrands = useMemo(() => {
        if (!filterOrdersData) return []
        // Filter by clientId if selected
        const baseOrders = clientId ? filterOrdersData.filter((o: any) => o.clientId === clientId) : filterOrdersData
        
        const uniques: any[] = []
        const seen = new Set()
        baseOrders.forEach((o: any) => {
            if (!seen.has(o.brandId)) {
                uniques.push({ id: o.brandId, name: o.brandName })
                seen.add(o.brandId)
            }
        })
        return uniques.sort((a,b) => a.name.localeCompare(b.name))
    }, [filterOrdersData, clientId])

    const { data: response, isLoading, isError, refetch } = useOrderDeliveryList(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
    const [selectedOrdersMap, setSelectedOrdersMap] = useState<Record<string, Order>>({})
    
    const handleSelectionChange = (ids: string[]) => {
        setSelectedOrderIds(ids);
        
        // Mantener objetos de pedidos seleccionados para persistencia entre páginas/filtros
        setSelectedOrdersMap(prev => {
            const newMap: Record<string, Order> = {};
            ids.forEach(id => {
                if (prev[id]) {
                    newMap[id] = prev[id];
                } else {
                    const fromCurrent = orders.find(o => o.id === id);
                    if (fromCurrent) newMap[id] = fromCurrent;
                }
            });
            return newMap;
        });
    }

    const isBatchMode = selectedOrderIds.length > 1 || (selectedOrderIds.length === 1 && !selectedOrder)
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false)
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false)
    const [creditDistributions, setCreditDistributions] = useState<Record<string, CreditDistribution>>({})

    const handleUpdateCreditDistribution = (orderId: string, distribution: CreditDistribution) => {
        setCreditDistributions(prev => ({
            ...prev,
            [orderId]: distribution
        }))
    }

    const selectedClientName = useMemo(() => {
        if (!clientId) return ""
        return dynamicClients.find(c => c.id === clientId)?.firstName || ""
    }, [clientId, dynamicClients])


    const clearFilters = () => {
        setBrandId("ALL")
        setClientId("")
        setDateRange(undefined)
        setOrderNumber("")
        setSearchTerm("")
        setDateCategoryFilter("ALL")
        setSelectedOrderIds([])
        setSelectedOrdersMap({})
        setCreditDistributions({}) // Clear distributions on filter reset
        setPage(1)
    }

    const displayedOrders = useMemo(() => {
        // Here we still apply the dateCategoryFilter locally as it's a dynamic visual filter 
        // that's not necessarily handled by the backend's explicit from/to dates.
        return orders.filter(order => {
            const now = new Date();
            const reception = order.receptionDate ? new Date(order.receptionDate) : new Date(order.createdAt);
            const diffTime = now.getTime() - reception.getTime();
            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (dateCategoryFilter === 'RECENT' && days > 5) return false;
            if (dateCategoryFilter === 'WARN' && (days <= 5 || days > 15)) return false;
            if (dateCategoryFilter === 'CRITICAL' && days <= 15) return false;

            return true;
        });
    }, [orders, dateCategoryFilter]);

    if (isError) return <div className="p-8 text-red-500">Error al cargar entregas.</div>

    const handleBatchDeliver = () => {
        if (!hasPermission('exchanges.delivery')) {
            notifyError({ message: 'No tienes permiso para realizar entregas de cambios' })
            return
        }
        if (selectedOrderIds.length === 0) return
        setIsDeliverModalOpen(true)
    }

    const handleExport = async () => {
        if (!hasPermission('exchanges.export_excel')) {
            notifyError({ message: 'No tienes permiso para exportar a Excel' })
            return
        }
        try {
            setIsExporting(true)
            const response = await orderApi.getAll({
                type: 'CAMBIO',
                status: 'RECIBIDO_EN_BODEGA',
                brandId: brandId === 'ALL' ? undefined : brandId,
                clientId: clientId || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                search: searchTerm || undefined,
                page: 1,
                limit: 5000
            })
            
            if (response && response.data.length > 0) {
                exportExchangesToExcel(response.data, `Cambios_Por_Entregar_${new Date().toISOString().split('T')[0]}.xlsx`)
            } else {
                alert("No hay cambios para exportar con estos filtros")
            }
        } catch (error) {
            console.error("Error exporting exchanges:", error)
        } finally {
            setIsExporting(false)
        }
    }

    const selectedOrders = useMemo(() => {
        const result = Object.values(selectedOrdersMap);
        console.log('[OrderDeliveryPage] Memoized selectedOrders updated:', { count: result.length, ids: result.map(o => o.id) });
        return result;
    }, [selectedOrdersMap])

    const pendingDistributionCount = useMemo(() => {
        return selectedOrders.filter(o => {
            const initialPaid = getPaidAmount(o)
            const finalTotal = Number(o.realInvoiceTotal || o.total || 0)
            const balance = finalTotal - initialPaid
            return balance < -0.01 && !creditDistributions[o.id]
        }).length
    }, [selectedOrders, creditDistributions])

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Entrega de Cambios" 
                description="Gestión de entregas finales de cambios y cobro de saldos"
                icon={Truck}
                actions={
                    <div className="flex gap-3">
                        {clientId && hasPermission('exchanges.reception') && (
                            <Button
                                onClick={() => setIsPendingModalOpen(true)}
                                className="h-10 border-monchito-purple/20 bg-monchito-purple/10 text-monchito-purple hover:bg-monchito-purple/20 transition-all px-4 font-black text-[10px] uppercase tracking-tight whitespace-nowrap rounded-xl shadow-sm"
                            >
                                <PackageOpen className="mr-1.5 h-3.5 w-3.5" />
                                Por Ingresar
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => navigate('/exchanges/delivery/history')} className="gap-2 rounded-xl h-10 border-slate-200">
                            <History className="h-4 w-4" />
                            Historial
                        </Button>
                        {hasPermission('exchanges.export_excel') && (
                            <Button 
                                variant="outline"
                                onClick={handleExport}
                                disabled={isExporting}
                                className="bg-white hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 gap-2 h-10 rounded-xl px-4 font-bold"
                            >
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                ) : (
                                    <FileDown className="h-4 w-4 text-emerald-500" />
                                )}
                                Exportar Excel
                            </Button>
                        )}
                        <Button variant="outline" onClick={clearFilters} title="Limpiar todos los filtros" className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-400 hover:text-orange-500">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                }
            />

            {/* Premium Filter Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-6">
                    {/* Cliente Selector - 3 cols */}
                    <div className="lg:col-span-3 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Empresaria</label>
                        <SearchableClientSelect onSelect={setClientId} value={clientId} clients={dynamicClients} />
                    </div>

                    {/* Catálogo - 3 cols */}
                    <div className="lg:col-span-3 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Catálogo / Marca</label>
                        <SearchableBrandSelect 
                            brands={dynamicBrands} 
                            value={brandId} 
                            onSelect={setBrandId} 
                        />
                    </div>

                    {/* Periodo - 4 cols */}
                    <div className="lg:col-span-4 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Rango de Recepción</label>
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            showLabel={false}
                            placeholder="Seleccionar periodo"
                            className="h-10"
                        />
                    </div>

                    {/* Mas filtros toggle */}
                    <div className="lg:col-span-2 flex items-end">
                        <Button 
                            variant="ghost" 
                            className={`h-10 w-full rounded-xl border ${showFilters ? 'bg-monchito-purple/5 border-monchito-purple/20 text-monchito-purple' : 'border-slate-100 text-slate-500'}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? 'Menos' : 'Más'}
                        </Button>
                    </div>

                    {showFilters && (
                        <>
                            <div className="lg:col-span-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Búsqueda General</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Cualquier texto..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-white border-slate-200 h-10 text-sm font-medium rounded-xl shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="lg:col-span-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Número de Orden</label>
                                <Input
                                    placeholder="Ej: ORD-123..."
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    className="bg-white border-slate-200 h-10 text-sm font-bold rounded-xl shadow-sm"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Batch Info Bar - Always visible, disabled when empty */}
            <div className={`bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm flex items-center justify-between transition-all ${selectedOrderIds.length === 0 ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="bg-monchito-purple/10 p-2.5 rounded-xl">
                        <Truck className="h-5 w-5 text-monchito-purple" />
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold text-sm leading-none mb-1">
                            {selectedOrderIds.length > 0 ? `${selectedOrderIds.length} cambios para entrega` : 'Selecciona cambios para entregar'}
                        </p>
                        {selectedOrders.length > 0 && (
                            <p className="text-slate-500 text-xs font-medium truncate max-w-[300px]">{selectedOrders[0]?.clientName}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        className="text-slate-500 hover:text-slate-700 border-slate-200 h-9 px-4 text-xs font-medium rounded-xl"
                        onClick={() => setSelectedOrderIds([])}
                        disabled={selectedOrderIds.length === 0}
                    >
                        Cancelar Selección
                    </Button>
                    <div className="flex flex-col items-end gap-1">
                        <Button 
                            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-medium px-6 rounded-xl h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleBatchDeliver}
                            disabled={selectedOrderIds.length === 0 || pendingDistributionCount > 0}
                        >
                            Proceder con Entrega
                        </Button>
                        {pendingDistributionCount > 0 && (
                            <span className="text-[10px] text-amber-600 font-bold animate-pulse">
                                Hay {pendingDistributionCount} saldos por distribuir
                            </span>
                        )}
                    </div>
                </div>
            </div>


            {/* Tags / Quick Selection */}
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-wrap gap-2 text-xs font-black">
                    <button
                        onClick={() => setDateCategoryFilter('ALL')}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${dateCategoryFilter === 'ALL' ? 'bg-monchito-purple border-monchito-purple text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-monchito-purple/30 hover:text-monchito-purple'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setDateCategoryFilter('RECENT')}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${dateCategoryFilter === 'RECENT' ? 'bg-monchito-purple border-monchito-purple text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-600'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${dateCategoryFilter === 'RECENT' ? 'bg-white' : 'bg-emerald-500'}`} />
                        Reciente
                    </button>
                    <button
                        onClick={() => setDateCategoryFilter('WARN')}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${dateCategoryFilter === 'WARN' ? 'bg-monchito-purple border-monchito-purple text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50/50 hover:text-amber-600'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${dateCategoryFilter === 'WARN' ? 'bg-white' : 'bg-amber-500'}`} />
                        5+ Días
                    </button>
                    <button
                        onClick={() => setDateCategoryFilter('CRITICAL')}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${dateCategoryFilter === 'CRITICAL' ? 'bg-monchito-purple border-monchito-purple text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-red-50/50 hover:text-red-600'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${dateCategoryFilter === 'CRITICAL' ? 'bg-white' : 'bg-red-500'}`} />
                        Crítico (+15)
                    </button>
                </div>

                <div className="text-xs font-medium text-slate-500">
                    Mostrando <span className="text-monchito-purple font-bold">{displayedOrders.length}</span> entregas pendientes
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <div className="h-10 w-10 border-4 border-slate-100 border-t-monchito-purple rounded-full animate-spin" />
                        <span className="font-bold text-sm">Cargando lista de entregas...</span>
                    </div>
                ) : (
                    <>
                        <OrderDeliveryTable 
                            orders={displayedOrders} 
                            selectedOrderIds={selectedOrderIds}
                            onSelectionChange={handleSelectionChange}
                            creditDistributions={creditDistributions}
                            onUpdateCreditDistribution={handleUpdateCreditDistribution}
                        />
                         {pagination && pagination.pages > 1 && (
                            <div className="p-4 border-t border-slate-100">
                                <Pagination
                                    currentPage={page}
                                    totalPages={pagination.pages}
                                    onPageChange={setPage}
                                    totalItems={pagination.total}
                                    itemsPerPage={limit}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            <DeliverOrderModalNew
                order={isBatchMode ? null : selectedOrder}
                orders={isBatchMode ? selectedOrders : []}
                creditDistributions={creditDistributions}
                open={isDeliverModalOpen}
                onOpenChange={(open) => {
                    setIsDeliverModalOpen(open)
                    if (!open) {
                        setSelectedOrder(null)
                    }
                }}
                onSuccess={() => {
                    refetch()
                    setSelectedOrderIds([])
                    setSelectedOrdersMap({})
                    setCreditDistributions({}) // Clear distributions on success
                }}
            />

            <PendingOrdersModal 
                isOpen={isPendingModalOpen}
                onClose={() => setIsPendingModalOpen(false)}
                clientId={clientId}
                clientName={selectedClientName}
            />
        </div>
    )
}
