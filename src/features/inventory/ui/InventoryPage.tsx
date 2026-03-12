import { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../model/hooks';
import { InventoryFilters } from './InventoryFilters';
import { InventoryTable } from './InventoryTable';
import { useDebounce } from '@/shared/lib/hooks';
import { Pagination } from '@/shared/ui/pagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useBrandList } from '@/features/brands/api/hooks';

import { PackageOpen, Clock, Truck, Boxes, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export function InventoryPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(50);

    // UI State for Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [brandFilter, setBrandFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    const { movements, stats, isLoading, pagination, refetch } = useInventory({
        page,
        limit,
        type: statusFilter === 'ALL' ? undefined : statusFilter,
        brandId: brandFilter,
        search: debouncedSearch,
        startDate,
        endDate,
        receiptNumber,
        orderNumber
    });

    // Reset to page 1 on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, brandFilter, startDate, endDate, receiptNumber, orderNumber]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
        setBrandFilter('');
        setStartDate('');
        setEndDate('');
        setReceiptNumber('');
        setOrderNumber('');
    };

    // Derived Data for Filters (Brands)
    const { data: brandsRes } = useBrandList();
    const availableBrands = useMemo(() => {
        const brandsEntries = brandsRes ? (Array.isArray(brandsRes) ? brandsRes : (brandsRes.data || [])) : [];
        return Array.isArray(brandsEntries) ? brandsEntries.map((b: any) => b.name).sort() : [];
    }, [brandsRes]);

    // Grouping Logic - Processed to ensure one row per Order in the inventory view
    const groupedRows = useMemo(() => {
        if (!movements || movements.length === 0) return [];

        const orderMap = new Map<string, any>();

        // Sort movements by date ascending to process flow correctly
        const sortedMovements = [...movements].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
        });

        sortedMovements.forEach(m => {
            if (!m.orderId) return; // Skip invalid entries

            if (!orderMap.has(m.orderId)) {
                orderMap.set(m.orderId, { ...m });
            } else {
                const existing = orderMap.get(m.orderId);
                // Update with latest status/dates
                existing.status = m.status;
                if (m.type === 'ENTRY') existing.entryDate = m.createdAt;
                if (m.type === 'DELIVERED') existing.deliveryDate = m.createdAt || m.deliveryDate;
                if (m.type === 'RETURNED') existing.returnDate = m.createdAt;
                
                // Recalculate days 
                existing.daysInWarehouse = m.daysInWarehouse;
            }
        });

        return Array.from(orderMap.values()).sort((a, b) => {
            const aDate = new Date(a.deliveryDate || a.returnDate || a.createdAt).getTime();
            const bDate = new Date(b.deliveryDate || b.returnDate || b.createdAt).getTime();
            return bDate - aDate;
        });

    }, [movements]);

    if (isLoading && movements.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400 min-h-[400px]">
                <div className="h-10 w-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
                <span className="font-bold text-sm">Cargando inventario de pedidos...</span>
            </div>
        );
    }

    const hasFilters = debouncedSearch || startDate || endDate || receiptNumber || orderNumber || statusFilter !== 'ALL' || brandFilter;

    return (
        <div className="space-y-6 container mx-auto py-8 px-4 animate-in fade-in duration-500">
            <PageHeader 
                title="Inventario de Pedidos" 
                description="Control físico, financiero y trazabilidad de paquetes"
                icon={Boxes}
                actions={
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white" 
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                    </Button>
                }
            />

            {/* KPI Cards */}
            <div className="flex flex-wrap gap-4 w-full">
                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[200px] flex-1">
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                        <PackageOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">En Bodega</p>
                        <p className="text-2xl font-black text-emerald-600 tracking-tight leading-none">{stats?.inWarehouse || 0}</p>
                    </div>
                </div>

                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[200px] flex-1">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                        <Truck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Entregados Hoy</p>
                        <p className="text-2xl font-black text-blue-600 tracking-tight leading-none">{stats?.deliveredToday || 0}</p>
                    </div>
                </div>

                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[200px] flex-1">
                    <div className="bg-red-50 p-3 rounded-xl text-red-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">+10 Días</p>
                        <p className="text-2xl font-black text-red-600 tracking-tight leading-none">{stats?.longStorage || 0}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <InventoryFilters
                search={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                brandFilter={brandFilter}
                onBrandChange={setBrandFilter}
                brands={availableBrands}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                receiptNumber={receiptNumber}
                onReceiptNumberChange={setReceiptNumber}
                orderNumber={orderNumber}
                onOrderNumberChange={setOrderNumber}
                onClear={clearFilters}
            />

            {/* Content Section */}
            {movements.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                    {hasFilters ? (
                        <>
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-400 opacity-50" />
                            <h3 className="text-lg font-bold text-slate-700">Sin coincidencias</h3>
                            <p className="text-sm text-slate-400 mt-2">Pruebe ajustando los filtros o limpie la búsqueda.</p>
                            <Button variant="link" onClick={clearFilters} className="mt-4 text-emerald-600 font-bold">Limpiar Filtros</Button>
                        </>
                    ) : (
                        <>
                            <PackageOpen className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                            <h3 className="text-lg font-bold text-slate-400">Inventario Vacío</h3>
                            <p className="text-sm text-slate-300 max-w-xs mx-auto mt-2 text-balance leading-relaxed">
                                No hay movimientos de inventario registrados. 
                                Ingrese mercadería en el módulo de Recepción para comenzar.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center px-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Mostrando <span className="text-slate-900">{groupedRows.length}</span> pedidos únicos
                        </p>
                    </div>
                    <InventoryTable movements={groupedRows} />
                </>
            )}

            {pagination && pagination.pages > 1 && (
                <div className="flex justify-center mt-8">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.pages}
                        onPageChange={setPage}
                        totalItems={pagination.total}
                        itemsPerPage={limit}
                    />
                </div>
            )}
        </div>
    );
}
