import { useState, useMemo } from 'react';
import { useInventory } from '../model/hooks';
import { InventoryFilters } from './InventoryFilters';
import { InventoryTable } from './InventoryTable';

import { PackageOpen, Clock, Truck, Boxes } from 'lucide-react';

import { PageHeader } from '@/shared/ui/PageHeader';

export function InventoryPage() {
    const { movements, stats, isLoading } = useInventory();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [brandFilter, setBrandFilter] = useState('');

    const availableBrands = useMemo(() => Array.from(new Set(movements.map(m => m.brandName))).sort(), [movements]);

    const filteredMovements = useMemo(() => {
        const orderMap = new Map<string, any>();

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
                existing.status = m.type;
                if (m.type === 'ENTRY') existing.entryDate = m.createdAt;
                if (m.type === 'DELIVERED') existing.deliveryDate = m.createdAt;
                if (m.type === 'RETURNED') existing.returnDate = m.createdAt;
            }
        });

        const groupedRows = Array.from(orderMap.values()).map(order => {
            let end = new Date();
            if (order.deliveryDate) end = new Date(order.deliveryDate);
            if (order.returnDate) end = new Date(order.returnDate);

            let days = 0;
            if (order.entryDate) {
                const start = new Date(order.entryDate);
                const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                const diffTime = Math.abs(endDay.getTime() - startDay.getTime());
                days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
            order.daysInWarehouse = days;
            return order;
        });

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
        return <div className="p-8 text-center text-slate-400 font-medium">Cargando inventario...</div>;
    }

    return (
        <div className="space-y-4">
            <PageHeader
                title="Inventario & Trazabilidad"
                description="Control físico de paquetes en bodega y entregas en tiempo real."
                icon={Boxes}
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                actions={
                    <div className="flex flex-wrap gap-3">
                        <div className="bg-white px-4 py-2 rounded-xl border border-monchito-teal/10 shadow-sm flex items-center gap-3">
                            <div className="bg-monchito-teal/5 p-2 rounded-lg text-monchito-teal">
                                <PackageOpen className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">En Bodega</p>
                                <p className="text-lg font-bold text-slate-700 leading-none">{stats.inWarehouse}</p>
                            </div>
                        </div>

                        <div className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <Truck className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">Entregados</p>
                                <p className="text-lg font-bold text-slate-700 leading-none">{stats.deliveredToday}</p>
                            </div>
                        </div>

                        <div className="bg-white px-4 py-2 rounded-xl border border-red-100 shadow-sm flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-lg text-red-600">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">+10 Días</p>
                                <p className="text-lg font-bold text-red-600 leading-none">{stats.longStorage}</p>
                            </div>
                        </div>
                    </div>
                }
            />

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <InventoryFilters
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    brandFilter={brandFilter}
                    onBrandChange={setBrandFilter}
                    brands={availableBrands}
                    hideSearch
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <InventoryTable movements={filteredMovements} />
            </div>
        </div>
    );
}
