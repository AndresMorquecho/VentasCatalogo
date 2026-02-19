import { useState, useMemo } from 'react';
import { useInventory } from '../model/hooks';
import { InventoryFilters } from './InventoryFilters';
import { InventoryTable } from './InventoryTable';

import { PackageOpen, Clock, Truck, Boxes } from 'lucide-react';

export function InventoryPage() {
    const { movements, stats, isLoading } = useInventory();

    // UI State for Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [brandFilter, setBrandFilter] = useState('');

    // Derived Data for Filters
    const availableBrands = useMemo(() => Array.from(new Set(movements.map(m => m.brandName))).sort(), [movements]);

    // Filter Logic in UI (Pure View Logic)
    const filteredMovements = useMemo(() => {
        return movements.filter(m => {
            const matchesSearch =
                m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.orderCode.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || m.type === statusFilter;
            const matchesBrand = brandFilter === '' || m.brandName === brandFilter;

            return matchesSearch && matchesStatus && matchesBrand;
        });
    }, [movements, searchTerm, statusFilter, brandFilter]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Cargando inventario...</div>;
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Boxes className="h-6 w-6 text-indigo-600" />
                        Inventario & Trazabilidad
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Control físico de paquetes en bodega y entregas.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="flex gap-4">
                    <div className="bg-white p-3 rounded-lg border shadow-sm flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                            <PackageOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 font-bold uppercase block">En Bodega</span>
                            <span className="text-xl font-bold text-slate-800">{stats.inWarehouse}</span>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border shadow-sm flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 font-bold uppercase block">Entregados Hoy</span>
                            <span className="text-xl font-bold text-slate-800">{stats.deliveredToday}</span>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border shadow-sm flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-full text-red-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 font-bold uppercase block">+10 Días</span>
                            <span className="text-xl font-bold text-red-600">{stats.longStorage}</span>
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
        </div>
    );
}
