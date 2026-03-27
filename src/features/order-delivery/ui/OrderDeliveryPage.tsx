import { useState, useMemo, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useOrderDeliveryList, useDeliveryPendingOptions } from "../model/useOrderDelivery"
import type { DeliveryFilters } from "../model/useOrderDelivery"
import { OrderDeliveryTable } from "./OrderDeliveryTable"
import { DeliverOrderModalNew } from "./DeliverOrderModalNew"
import { PendingReceptionModal } from "./PendingReceptionModal"
import type { Order } from "@/entities/order/model/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, History, Truck, RotateCcw, ChevronDown } from "lucide-react"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Pagination } from "@/shared/ui/pagination"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"
import { useNotifications } from "@/shared/lib/notifications"

/* --- Searchable Select for Clients --- */
function SearchableClientSelect({
    onSelect,
    value,
    clients,
    isLoading
}: {
    onSelect: (clientId: string) => void,
    value: string,
    clients: any[],
    isLoading?: boolean
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
                        {isLoading ? (
                            <div className="px-3 py-4 text-xs text-slate-400 text-center italic">Cargando empresarias...</div>
                        ) : clients.length === 0 ? (
                            <div className="px-3 py-4 text-xs text-slate-400 text-center italic">No se encontraron empresarias</div>
                        ) : (
                            clients.map((c) => (
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
    brands,
    isLoading
}: {
    onSelect: (brandId: string) => void,
    value: string,
    brands: any[],
    isLoading?: boolean
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
                        {isLoading ? (
                            <div className="px-4 py-3 text-center text-[10px] text-slate-400 italic">Cargando marcas...</div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export function OrderDeliveryPage() {
    const navigate = useNavigate()
    const { notifyError } = useNotifications()

    // Filter State
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [brandId, setBrandId] = useState<string>("ALL")
    const [clientId, setClientId] = useState<string>("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [dateCategoryFilter, setDateCategoryFilter] = useState<'ALL' | 'RECENT' | 'WARN' | 'CRITICAL'>('ALL')
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false)

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    // Determine if we should perform the main fetch
    const isEnabled = !!clientId || brandId !== "ALL" || !!searchTerm || !!dateRange

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [brandId, clientId, dateRange, searchTerm]);

    // Memoized filters for the hook
    const filters = useMemo((): DeliveryFilters => ({
        startDate,
        endDate,
        brandId,
        clientId,
        searchText: searchTerm,
        page,
        limit,
        enabled: isEnabled
    }), [startDate, endDate, brandId, clientId, searchTerm, page, limit, isEnabled])

    const { data: response, isLoading, isError, refetch } = useOrderDeliveryList(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    // Get filter options from pending orders
    const { data: pendingOptions, isLoading: isLoadingOptions } = useDeliveryPendingOptions()
    const clientsWithPending = pendingOptions?.clients || []
    const brandsWithPending = pendingOptions?.brands || []

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false)
    const [isBatchMode, setIsBatchMode] = useState(false)
    // Credit distribution per order-id (set before delivery)
    const [creditDistributions, setCreditDistributions] = useState<Record<string, import('@/entities/financial-record/model/types').CreditDistribution>>({})

    const handleUpdateCreditDistribution = (orderId: string, dist: import('@/entities/financial-record/model/types').CreditDistribution) => {
        setCreditDistributions(prev => ({ ...prev, [orderId]: dist }))
    }


    const clearFilters = () => {
        setBrandId("ALL")
        setClientId("")
        setDateRange(undefined)
        setSearchTerm("")
        setDateCategoryFilter("ALL")
        setSelectedOrderIds([])
        setCreditDistributions({})
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

        // Validate: every selected order with a credit surplus must have a distribution configured
        const ordersWithPendingCredit = selectedOrders.filter(order => {
            const effective = Number(order.realInvoiceTotal ?? order.total)
            const paid = order.payments?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0
            const creditNote = Number(order.creditNoteTotal || 0)
            const credit = effective - paid - creditNote
            return credit < -0.01 && !creditDistributions[order.id]
        })

        if (ordersWithPendingCredit.length > 0) {
            const receipts = ordersWithPendingCredit.map(o => `#${o.receiptNumber}`).join(', ')
            notifyError({
                message: `Distribución pendiente en: ${receipts}. Usa el botón "Distribuir" en cada pedido con saldo a favor antes de proceder.`
            })
            return
        }

        setIsBatchMode(true)
        setIsDeliverModalOpen(true)
    }

    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id))

    return (
        <div className="space-y-6">
            <PageHeader
                title="Entrega al Cliente"
                description="Gestión de entregas finales y cobro de saldos pendientes"
                icon={Truck}
                actions={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => navigate('/orders/delivery/history')} className="gap-2 rounded-xl h-10 border-slate-200">
                            <History className="h-4 w-4" />
                            Historial
                        </Button>
                    </div>
                }
            />

            {/* Consolidated Filter Bar */}
            <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-monchito-purple">
                <div className="flex flex-col lg:flex-row lg:items-end gap-5">

                    {/* Cliente Selector */}
                    <div className="flex-[2] min-w-[300px] space-y-1.5">
                        <div className="flex items-center justify-between gap-1.5 pl-1">
                            <div className="flex items-center gap-1.5 ">
                                <Truck className="h-3 w-3 text-monchito-purple" />
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresaria ({clientsWithPending.length})</label>
                            </div>
                            {clientId && (
                                <button
                                    onClick={() => setIsPendingModalOpen(true)}
                                    className="text-[9px] font-black text-monchito-purple hover:text-monchito-purple/70 uppercase tracking-tighter flex items-center gap-0.5 transition-colors bg-monchito-purple/5 px-2 py-0.5 rounded-lg whitespace-nowrap"
                                >
                                    <Search className="h-2 w-2" />
                                    Ver Por Recibir
                                </button>
                            )}
                        </div>
                        <SearchableClientSelect onSelect={setClientId} value={clientId} clients={clientsWithPending} isLoading={isLoadingOptions} />
                    </div>

                    {/* Catálogo */}
                    <div className="flex-1 min-w-[140px] space-y-1.5">
                        <div className="flex items-center gap-1.5 pl-1">
                            <Truck className="h-3 w-3 text-monchito-purple" />
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catálogo ({brandsWithPending.length})</label>
                        </div>
                        <SearchableBrandSelect
                            brands={brandsWithPending}
                            value={brandId}
                            onSelect={setBrandId}
                            isLoading={isLoadingOptions}
                        />
                    </div>

                    {/* Búsqueda Global */}
                    <div className="flex-[1.5] min-w-[200px] space-y-1.5">
                        <div className="flex items-center gap-1.5 pl-1">
                            <Search className="h-3 w-3 text-monchito-purple" />
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Búsqueda Global</label>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 group-focus-within:text-monchito-purple transition-colors" />
                            <Input
                                placeholder="Factura, NC, Orden, Cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 bg-slate-50 border-transparent hover:border-monchito-purple/20 focus:bg-white focus:border-monchito-purple/50 rounded-xl text-sm font-medium transition-all shadow-none focus:shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Periodo */}
                    <div className="flex-[1.2] min-w-[180px] space-y-1.5">
                        <div className="flex items-center gap-1.5 pl-1">
                            <History className="h-3 w-3 text-monchito-purple" />
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recepción</label>
                        </div>
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            showLabel={false}
                            placeholder="Cualquier fecha"
                            className="h-10 border-slate-200"
                        />
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="h-10 w-10 p-0 rounded-xl border border-slate-100 text-slate-300 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/30"
                            title="Limpiar filtros"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Batch Info Bar - Always visible, disabled when empty */}
            {(() => {
                const pendingDistCount = selectedOrders.filter(order => {
                    const effective = Number(order.realInvoiceTotal ?? order.total)
                    const paid = order.payments?.reduce((s: number, p: any) => s + Number(p.amount || 0), 0) || 0
                    const creditNote = Number((order as any).creditNoteTotal || 0)
                    return effective - paid - creditNote < -0.01 && !creditDistributions[order.id]
                }).length

                return (
                    <div className={`border px-6 py-4 rounded-2xl shadow-sm flex items-center justify-between transition-all ${selectedOrderIds.length === 0 ? 'opacity-50 bg-white border-slate-200'
                            : pendingDistCount > 0 ? 'bg-amber-50/40 border-amber-300'
                                : 'bg-white border-slate-200'
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${pendingDistCount > 0 && selectedOrderIds.length > 0 ? 'bg-amber-100' : 'bg-monchito-purple/10'}`}>
                                <Truck className={`h-5 w-5 ${pendingDistCount > 0 && selectedOrderIds.length > 0 ? 'text-amber-600' : 'text-monchito-purple'}`} />
                            </div>
                            <div>
                                <p className="text-slate-900 font-bold text-sm leading-none mb-1">
                                    {selectedOrderIds.length > 0 ? `${selectedOrderIds.length} pedidos para entrega` : 'Selecciona pedidos para entregar'}
                                </p>
                                {selectedOrders.length > 0 && (
                                    <p className="text-slate-500 text-xs font-medium truncate max-w-[300px]">{selectedOrders[0]?.clientName}</p>
                                )}
                                {pendingDistCount > 0 && selectedOrderIds.length > 0 && (
                                    <p className="text-amber-600 text-xs font-bold mt-0.5">
                                        ⚠ {pendingDistCount} pedido{pendingDistCount > 1 ? 's' : ''} con saldo a favor sin distribuir
                                    </p>
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
                            <Button
                                className={`text-white font-medium px-6 rounded-xl h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${pendingDistCount > 0 && selectedOrderIds.length > 0
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : 'bg-monchito-purple hover:bg-monchito-purple/90'
                                    }`}
                                onClick={handleBatchDeliver}
                                disabled={selectedOrderIds.length === 0}
                            >
                                {pendingDistCount > 0 ? `Distribuir Saldos (${pendingDistCount})` : 'Proceder con Entrega'}
                            </Button>
                        </div>
                    </div>
                )
            })()}


            {/* Tags / Quick Selection */}
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <button
                        onClick={() => setDateCategoryFilter('ALL')}
                        className={`px-4 py-2 rounded-xl border transition-all ${dateCategoryFilter === 'ALL' ? 'bg-monchito-purple border-monchito-purple text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-monchito-purple/30 hover:text-monchito-purple'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setDateCategoryFilter('RECENT')}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${dateCategoryFilter === 'RECENT' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50/50'}`}
                    >
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        Reciente
                    </button>
                    <button
                        onClick={() => setDateCategoryFilter('WARN')}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${dateCategoryFilter === 'WARN' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50/50'}`}
                    >
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        5+ Días
                    </button>
                    <button
                        onClick={() => setDateCategoryFilter('CRITICAL')}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${dateCategoryFilter === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-red-50/50'}`}
                    >
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
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
                        <span className="font-bold text-sm">Buscando pedidos...</span>
                    </div>
                ) : !isEnabled ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <Search className="h-12 w-12 text-slate-200" />
                        <div className="text-center">
                            <p className="font-bold text-slate-500">Selecciona una Empresaria o Catálogo</p>
                            <p className="text-xs">Usa los filtros superiores para ver los pedidos disponibles para entrega</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <OrderDeliveryTable
                            orders={displayedOrders}
                            selectedOrderIds={selectedOrderIds}
                            onSelectionChange={setSelectedOrderIds}
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
                open={isDeliverModalOpen}
                onOpenChange={(open) => {
                    setIsDeliverModalOpen(open)
                    if (!open) {
                        setSelectedOrder(null)
                        setIsBatchMode(false)
                    }
                }}
                onSuccess={() => {
                    refetch()
                    setSelectedOrderIds([])
                    setCreditDistributions({})
                }}
                creditDistributions={creditDistributions}
            />

            {clientId && (
                <PendingReceptionModal
                    clientId={clientId}
                    clientName={clientsWithPending.find(c => c.id === clientId)?.firstName || 'Empresaria'}
                    open={isPendingModalOpen}
                    onOpenChange={setIsPendingModalOpen}
                />
            )}
        </div>
    )
}
