import { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../model/hooks';
import { InventoryFilters } from './InventoryFilters';
import { InventoryTable } from './InventoryTable';
import { useDebounce } from '@/shared/lib/hooks';
import { Pagination } from '@/shared/ui/pagination';
import { PageHeader } from '@/shared/ui/PageHeader';

import { PackageOpen, Clock, Truck, Boxes } from 'lucide-react';

export function InventoryPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(50);

    // UI State for Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 1000);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [brandFilter, setBrandFilter] = useState('');

    const { movements, stats, isLoading, pagination } = useInventory({
        page,
        limit,
        type: statusFilter === 'ALL' ? undefined : statusFilter,
        // Since we don't have a direct 'search' in inventory backend yet, we'll keep local search
        // or I could add search to inventory backend. Let's see if I added it.
        // Yes, I added logic for brandId and orderId, but not generic text search in inventory.
        // Actually, I'll filter locally for now but use paginated base data.
    });

    // Reset to page 1 on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, brandFilter]);

    // Derived Data for Filters
    const availableBrands = useMemo(() => Array.from(new Set(movements.map(m => m.brandName))).sort(), [movements]);

    // Filter Logic in UI (Pure View Logic) - Now with Grouping
    const filteredMovements = useMemo(() => {
        // 1. Group movements by orderCode/orderId
        const orderMap = new Map<string, any>();

        // Ensure movements are sorted by date ascending so we process oldest to newest
        const sortedMovements = [...movements].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        sortedMovements.forEach(m => {
            if (!orderMap.has(m.orderId)) {
                orderMap.set(m.orderId, {
                    orderId: m.orderId,
                    clientName: m.clientName,
                    brandName: m.brandName,
                    orderCode: m.orderCode,
                    entryDate: m.type === 'ENTRY' ? m.createdAt : null,
                    deliveryDate: m.type === 'DELIVERED' ? m.createdAt : null,
                    returnDate: m.type === 'RETURNED' ? m.createdAt : null,
                    status: m.type,
                    daysInWarehouse: 0
                });
            } else {
                const existing = orderMap.get(m.orderId);
                existing.status = m.type; // Set to the latest status
                if (m.type === 'ENTRY') existing.entryDate = m.createdAt;
                if (m.type === 'DELIVERED') existing.deliveryDate = m.createdAt;
                if (m.type === 'RETURNED') existing.returnDate = m.createdAt;
            }
        });

        // 2. Format grouped rows and calculate final Days in Warehouse
        const groupedRows = Array.from(orderMap.values()).map(order => {
            let end = new Date(); // default to today if still in warehouse
            if (order.deliveryDate) end = new Date(order.deliveryDate);
            if (order.returnDate) end = new Date(order.returnDate);

            let days = 0;
            if (order.entryDate) {
                const start = new Date(order.entryDate);
                // Strip time portion for fair days calculation
                const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                const diffTime = Math.abs(endDay.getTime() - startDay.getTime());
                days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
            order.daysInWarehouse = days;
            return order;
        });

        // 3. Apply Filters and sort descending
        return groupedRows.filter(m => {
            const matchesSearch =
                m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.orderCode.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
            const matchesBrand = brandFilter === '' || m.brandName === brandFilter;

            return matchesSearch && matchesStatus && matchesBrand;
        }).sort((a, b) => {
            const aDate = new Date(a.deliveryDate || a.returnDate || a.entryDate).getTime();
            const bDate = new Date(b.deliveryDate || b.returnDate || b.entryDate).getTime();
            return bDate - aDate;
        });

    }, [movements, searchTerm, statusFilter, brandFilter]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Cargando inventario...</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Inventario & Trazabilidad" 
                description="Control físico de paquetes en bodega y entregas"
                icon={Boxes}
            />

            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* KPI Cards */}
                <div className="flex flex-wrap gap-4 w-full">
                    <div className="bg-white px-5 py-3 rounded-xl border border-emerald-100 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.3)] flex items-center gap-3 min-w-[180px]">
                        <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
                            <PackageOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[11px] font-semibold mb-0.5">En Bodega</p>
                            <p className="text-xl font-bold text-slate-800 tracking-tight leading-none">{stats.inWarehouse}</p>
                        </div>
                    </div>

                    <div className="bg-white px-5 py-3 rounded-xl border border-blue-100 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.3)] flex items-center gap-3 min-w-[180px]">
                        <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[11px] font-semibold mb-0.5">Entregados Hoy</p>
                            <p className="text-xl font-bold text-slate-800 tracking-tight leading-none">{stats.deliveredToday}</p>
                        </div>
                    </div>

                    <div className="bg-white px-5 py-3 rounded-xl border border-red-100 shadow-[0_2px_10px_-3px_rgba(239,68,68,0.3)] flex items-center gap-3 min-w-[180px]">
                        <div className="bg-red-50 p-2.5 rounded-lg text-red-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[11px] font-semibold mb-0.5">+10 Días</p>
                            <p className="text-xl font-bold text-red-600 tracking-tight leading-none">{stats.longStorage}</p>
                        </div>
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
            />

            {/* Table */}
            <InventoryTable movements={filteredMovements} />

            {pagination && (
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            )}
        </div>
    );
}
