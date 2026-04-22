import { useState, useMemo, useRef, useEffect, lazy, Suspense, memo } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderDeliveryList, useOrderDeliveryFilterData } from "../model/useOrderDelivery"
import type { DeliveryFilters } from "../model/useOrderDelivery"
import { OrderDeliveryTable } from "./OrderDeliveryTable"

// Lazy load heavy modals
const DeliverOrderModalNew = lazy(() => import("./DeliverOrderModalNew").then(module => ({ default: module.DeliverOrderModalNew })))
const PendingOrdersModal = lazy(() => import("./PendingOrdersModal").then(module => ({ default: module.PendingOrdersModal })))

import type { Order } from "@/entities/order/model/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, History, Truck, RotateCcw, ChevronDown, PackageOpen, FileDown, Loader2 } from "lucide-react"
import { PageHeader } from "@/shared/ui/PageHeader"
import { orderApi } from "@/entities/order/model/api"
import { exportOrdersToExcel } from "@/shared/lib/exportExcel"
import { Pagination } from "@/shared/ui/pagination"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { useAuth } from "@/shared/auth"

/* --- Searchable Select for Clients --- */
const SearchableClientSelect = memo(function SearchableClientSelect({ 
    onSelect, 
    value,
    clients,
    onKeyDownNavigation,
    navId
}: { 
    onSelect: (clientId: string) => void, 
    value: string,
    clients: any[],
    onKeyDownNavigation?: (e: React.KeyboardEvent) => void,
    navId?: string
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
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm items-center justify-between cursor-pointer hover:border-monchito-purple/50 transition-colors focus:ring-1 focus:ring-monchito-purple outline-none"
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsOpen(!isOpen)
                    if (!isOpen && onKeyDownNavigation) onKeyDownNavigation(e)
                }}
                data-nav={navId}
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
                            onClick={() => { onSelect(""); setIsOpen(false); setSearch(""); }}
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
})

/* --- Searchable Select for Brands --- */
const SearchableBrandSelect = memo(function SearchableBrandSelect({ 
    onSelect, 
    value,
    brands,
    onKeyDownNavigation,
    navId
}: { 
    onSelect: (brandId: string) => void, 
    value: string,
    brands: any[],
    onKeyDownNavigation?: (e: React.KeyboardEvent) => void,
    navId?: string
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
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsOpen(!isOpen)
                    if (!isOpen && onKeyDownNavigation) onKeyDownNavigation(e)
                }}
                data-nav={navId}
                className="bg-white border-slate-200 h-11 px-4 flex items-center justify-between cursor-pointer text-sm font-bold rounded-xl border focus:ring-1 focus:ring-monchito-purple/50 outline-none shadow-sm transition-all"
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
})

export function OrderDeliveryPage() {
    const navigate = useNavigate()
    const { hasPermission } = useAuth()
    const canConfirm = hasPermission('delivery.confirm')

    // Filter State
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [brandId, setBrandId] = useState<string>("ALL")
    const [clientId, setClientId] = useState<string>("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [orderNumber, setOrderNumber] = useState<string>("")
    
    const [isExporting, setIsExporting] = useState(false)
    const [dateCategoryFilter, setDateCategoryFilter] = useState<'ALL' | 'RECENT' | 'WARN' | 'CRITICAL'>('ALL')

    const handleHeaderKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
        const fields = [
            'clientId', 'brandId', 'dateRange',
            'orderNumber', 'historyBtn', 'exportBtn', 'clearBtn'
        ];
        
        const currentIndex = fields.indexOf(fieldName);

        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const tagName = e.currentTarget.tagName;
            const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA';
            const isControl = tagName === 'SELECT' || tagName === 'DIV' || tagName === 'BUTTON';
            
            let selectionAtBoundary = false;
            if (isInput) {
                const input = e.currentTarget as HTMLInputElement;
                try {
                    if (input.selectionStart !== null) {
                        if (e.key === 'ArrowRight') selectionAtBoundary = input.selectionStart === input.value.length;
                        else selectionAtBoundary = input.selectionStart === 0;
                    } else {
                        selectionAtBoundary = true;
                    }
                } catch(err) {
                    selectionAtBoundary = true;
                }
            } else if (isControl) {
                selectionAtBoundary = true;
            }

            if (selectionAtBoundary) {
                const direction = e.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = currentIndex + direction;
                if (nextIndex >= 0 && nextIndex < fields.length) {
                    e.preventDefault();
                    const target = document.querySelector(`[data-nav="${fields[nextIndex]}"]`) as HTMLElement;
                    if (target) {
                        target.focus();
                        if (target instanceof HTMLInputElement) target.select();
                    }
                }
            }
        }
    };

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    useEffect(() => {
        setPage(1);
    }, [brandId, clientId, startDate, endDate, orderNumber, dateCategoryFilter]);

    const filters = useMemo((): DeliveryFilters => ({
        startDate,
        endDate,
        brandId,
        clientId,
        orderNumber,
        page,
        limit
    }), [startDate, endDate, brandId, clientId, orderNumber, page, limit])

    // Query for filter data (Only ones that HAVE orders to deliver)
    const { data: filterOrdersData } = useOrderDeliveryFilterData()

    // Extract relevant clients and brands from deliverable orders
    const dynamicClients = useMemo(() => {
        if (!filterOrdersData) return []
        
        const clientMap = new Map();
        for (const o of filterOrdersData) {
            const order = o as any;
            if (!clientMap.has(order.clientId)) {
                clientMap.set(order.clientId, { 
                    id: order.clientId, 
                    firstName: order.clientName, 
                    identificationNumber: order.clientIdentification,
                    city: order.clientCity 
                });
            }
        }
        
        return Array.from(clientMap.values()).sort((a, b) => a.firstName.localeCompare(b.firstName));
    }, [filterOrdersData])

    const dynamicBrands = useMemo(() => {
        if (!filterOrdersData) return []
        const brandMap = new Map();
        
        for (const o of filterOrdersData) {
            if (clientId && o.clientId !== clientId) continue;
            if (!brandMap.has(o.brandId)) {
                brandMap.set(o.brandId, { id: o.brandId, name: o.brandName });
            }
        }
        
        return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
        if (selectedOrderIds.length === 0) return
        setIsDeliverModalOpen(true)
    }

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const response = await orderApi.getAll({
                status: 'RECIBIDO_EN_BODEGA',
                brandId: brandId === 'ALL' ? undefined : brandId,
                clientId: clientId || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                orderNumber: orderNumber || undefined,
                page: 1,
                limit: 5000
            })
            
            if (response && response.data.length > 0) {
                exportOrdersToExcel(
                    response.data, 
                    `Pedidos_Por_Entregar_${new Date().toISOString().split('T')[0]}.xlsx`,
                    { 
                        brandId: brandId === 'ALL' ? undefined : brandId,
                        clientId: clientId || undefined,
                        orderNumber: orderNumber || undefined
                    }
                )
            } else {
                alert("No hay pedidos para exportar con estos filtros")
            }
        } catch (error) {
            console.error("Error exporting excel:", error)
        } finally {
            setIsExporting(false)
        }
    }

    const selectedOrders = useMemo(() => {
        const result = Object.values(selectedOrdersMap);
        console.log('[OrderDeliveryPage] Memoized selectedOrders updated:', { count: result.length, ids: result.map(o => o.id) });
        return result;
    }, [selectedOrdersMap])

    /** Para PDF de distribución: pedidos en página + seleccionados (otras páginas) */
    const deliveryPdfContextOrders = useMemo(() => {
        const byId = new Map<string, Order>()
        for (const o of orders) byId.set(o.id, o)
        for (const o of selectedOrders) byId.set(o.id, o)
        return Array.from(byId.values())
    }, [orders, selectedOrders])

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
                title="Entrega al Cliente" 
                description="Gestión de entregas finales y cobro de saldos pendientes"
                icon={Truck}
                actions={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                        {clientId && (
                            <Button
                                onClick={() => setIsPendingModalOpen(true)}
                                className="w-full sm:w-auto h-10 border-monchito-purple/20 bg-monchito-purple/10 text-monchito-purple hover:bg-monchito-purple/20 transition-all px-4 font-black text-[10px] uppercase tracking-tight whitespace-nowrap rounded-xl shadow-sm"
                            >
                                <PackageOpen className="mr-1.5 h-3.5 w-3.5" />
                                Por Ingresar
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => navigate('/orders/delivery/history')} data-nav="historyBtn" onKeyDown={e => handleHeaderKeyDown(e, 'historyBtn')} className="w-full sm:w-auto gap-2 rounded-xl h-10 border-slate-200">
                            <History className="h-4 w-4" />
                            Historial
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={handleExport}
                            data-nav="exportBtn"
                            onKeyDown={e => handleHeaderKeyDown(e, 'exportBtn')}
                            disabled={isExporting}
                            className="w-full sm:w-auto bg-white hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 gap-2 h-10 rounded-xl px-4"
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="h-4 w-4 text-emerald-600" />
                            )}
                            Exportar Excel
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={clearFilters} 
                            data-nav="clearBtn" 
                            tabIndex={10}
                            onKeyDown={e => handleHeaderKeyDown(e, 'clearBtn')} 
                            title="Limpiar todos los filtros" 
                            className="w-full sm:w-10 h-10 p-0 rounded-xl border-slate-200 text-slate-400 hover:text-orange-500 flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span className="sm:hidden font-bold">Limpiar Filtros</span>
                        </Button>
                    </div>
                }
            />

            <Suspense fallback={null}>
                <DeliverOrderModalNew
                    order={isBatchMode ? null : selectedOrder}
                    orders={isBatchMode ? selectedOrders : []}
                    contextOrders={deliveryPdfContextOrders}
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
                    onClearSelection={() => {
                        setSelectedOrderIds([])
                        setSelectedOrdersMap({})
                        setCreditDistributions({})
                    }}
                />

                <PendingOrdersModal 
                    isOpen={isPendingModalOpen}
                    onClose={() => setIsPendingModalOpen(false)}
                    clientId={clientId}
                    clientName={selectedClientName}
                />
            </Suspense>

            {/* Premium Filter Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-3 gap-y-4 items-end">
                    {/* Cliente Selector */}
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Empresaria</label>
                        <SearchableClientSelect 
                            onSelect={setClientId} 
                            value={clientId} 
                            clients={dynamicClients} 
                            navId="clientId" 
                            onKeyDownNavigation={e => handleHeaderKeyDown(e, 'clientId')} 
                        />
                    </div>

                    {/* Catálogo */}
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Catálogo / Marca</label>
                        <SearchableBrandSelect 
                            brands={dynamicBrands} 
                            value={brandId} 
                            onSelect={setBrandId} 
                            navId="brandId"
                            onKeyDownNavigation={e => handleHeaderKeyDown(e, 'brandId')}
                        />
                    </div>

                    {/* Periodo */}
                    <div className="lg:col-span-4 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Rango de Recepción</label>
                        <div data-nav="dateRange" onKeyDown={e => handleHeaderKeyDown(e, 'dateRange')} tabIndex={0} className="outline-none">
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                showLabel={false}
                                placeholder="Seleccionar periodo"
                                buttonClassName="h-10 rounded-xl border-slate-200"
                            />
                        </div>
                    </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Número de Orden</label>
                        <Input
                            placeholder="Ej: ORD-123..."
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            onKeyDown={e => handleHeaderKeyDown(e, 'orderNumber')}
                            data-nav="orderNumber"
                            tabIndex={0}
                            className="bg-white border-slate-200 h-10 text-sm font-bold rounded-xl shadow-sm focus:ring-monchito-purple/10 transition-all text-monchito-purple"
                        />
                    </div>
                </div>
            </div>

            {/* Batch Info Bar - Always visible, disabled when empty */}
            <div className={`bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${selectedOrderIds.length === 0 ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="bg-monchito-purple/10 p-2.5 rounded-xl shrink-0">
                        <Truck className="h-5 w-5 text-monchito-purple" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-slate-900 font-bold text-sm leading-none mb-1 truncate">
                            {selectedOrderIds.length > 0 ? `${selectedOrderIds.length} pedidos para entrega` : 'Selecciona pedidos para entregar'}
                        </p>
                        {selectedOrders.length > 0 ? (
                            <p className="text-slate-500 text-xs font-medium truncate max-w-full">{selectedOrders[0]?.clientName}</p>
                        ) : null}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline"
                        className="text-slate-500 hover:text-slate-700 border-slate-200 h-9 px-4 text-xs font-medium rounded-xl w-full sm:w-auto"
                        onClick={() => setSelectedOrderIds([])}
                        disabled={selectedOrderIds.length === 0}
                    >
                        Cancelar Selección
                    </Button>
                    <div className="flex flex-col items-stretch sm:items-end gap-1 w-full sm:w-auto">
                        <Button 
                            className={`bg-monchito-purple hover:bg-monchito-purple/90 text-white font-medium px-6 rounded-xl h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${!canConfirm ? 'opacity-50 grayscale' : ''}`}
                            onClick={handleBatchDeliver}
                            disabled={selectedOrderIds.length === 0 || pendingDistributionCount > 0 || !canConfirm}
                            title={!canConfirm ? "No tienes permiso para entregar pedidos" : ""}
                        >
                            Proceder con Entrega
                        </Button>
                         {pendingDistributionCount > 0 ? (
                            <span className="text-[10px] text-amber-600 font-bold animate-pulse text-center sm:text-right">
                                Hay {pendingDistributionCount} saldos por distribuir
                            </span>
                        ) : null}
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
                            onSuccess={refetch}
                        />
                         {pagination && pagination.pages > 1 ? (
                            <div className="p-4 border-t border-slate-100">
                                <Pagination
                                    currentPage={page}
                                    totalPages={pagination.pages}
                                    onPageChange={setPage}
                                    totalItems={pagination.total}
                                    itemsPerPage={limit}
                                />
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    )
}
