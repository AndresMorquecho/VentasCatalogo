import { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../model/hooks';
import { InventoryFilters } from './InventoryFilters';
import { InventoryTable } from './InventoryTable';
import { useDebounce } from '@/shared/lib/hooks';
import { Pagination } from '@/shared/ui/pagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useBrandList } from '@/features/brands/api/hooks';
import type { DateRange } from 'react-day-picker';

import { 
    PackageOpen, Clock, Truck, Boxes, 
    AlertCircle, FileDown, Loader2, PackageSearch 
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { exportInventoryToExcel } from '@/shared/lib/exportExcel';
import { inventoryApi } from '@/shared/api/inventoryApi';
import { calculateDaysInWarehouse } from '../lib/calculateDaysInWarehouse';

export function InventoryPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [isExporting, setIsExporting] = useState(false);

    // UI State for Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [deliveredFilter, setDeliveredFilter] = useState('ALL');
    const [receivedFilter, setReceivedFilter] = useState('ALL');
    const [brandFilter, setBrandFilter] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [receiptNumber, setReceiptNumber] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : '';
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : '';

    // Map UI filters to API status
    const apiType = useMemo(() => {
        if (deliveredFilter === 'SI') return 'DELIVERED';
        if (receivedFilter === 'SI' && deliveredFilter === 'NO') return 'ENTRY';
        return undefined;
    }, [deliveredFilter, receivedFilter]);

    // 📊 Reset to page 1 when any filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, brandFilter, deliveredFilter, receivedFilter, dateRange, receiptNumber, orderNumber]);

    const { movements, stats, isLoading, pagination } = useInventory({
        page,
        limit,
        type: apiType,
        brandId: brandFilter,
        search: debouncedSearch,
        startDate,
        endDate,
        receiptNumber,
        orderNumber
    });

    const clearFilters = () => {
        setSearchTerm('');
        setDeliveredFilter('ALL');
        setReceivedFilter('ALL');
        setBrandFilter('');
        setDateRange(undefined);
        setReceiptNumber('');
        setOrderNumber('');
    };

    // Derived Data for Brands
    const { data: brandsRes } = useBrandList();
    const availableBrands = useMemo(() => {
        const brandsEntries = brandsRes ? (Array.isArray(brandsRes) ? brandsRes : (brandsRes.data || [])) : [];
        return Array.isArray(brandsEntries) ? brandsEntries.map((b: any) => b.name).sort() : [];
    }, [brandsRes]);

    // Grouping Logic
    const groupedRows = useMemo(() => {
        if (!movements || movements.length === 0) return [];

        const orderMap = new Map<string, any>();
        const sortedMovements = [...movements].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
        });

        sortedMovements.forEach(m => {
            if (!m.orderId) return;
            if (!orderMap.has(m.orderId)) {
                orderMap.set(m.orderId, { ...m });
            } else {
                const existing = orderMap.get(m.orderId);
                existing.status = m.status;
                if (m.type === 'ENTRY') existing.entryDate = m.createdAt;
                if (m.type === 'DELIVERED') existing.deliveryDate = m.createdAt || m.deliveryDate;
                if (m.type === 'RETURNED') existing.returnDate = m.createdAt;
                existing.daysInWarehouse = m.daysInWarehouse;
            }
        });

        let result = Array.from(orderMap.values());

        if (deliveredFilter !== 'ALL') {
            const isDelivered = deliveredFilter === 'SI';
            result = result.filter(r => (r.status === 'DELIVERED') === isDelivered);
        }

        if (receivedFilter !== 'ALL') {
            const isReceived = receivedFilter === 'SI';
            result = result.filter(r => (r.status === 'ENTRY' || r.status === 'DELIVERED') === isReceived);
        }

        return result.sort((a, b) => {
            const aDate = new Date(a.deliveryDate || a.returnDate || a.createdAt).getTime();
            const bDate = new Date(b.deliveryDate || b.returnDate || b.createdAt).getTime();
            return bDate - aDate;
        });
    }, [movements, deliveredFilter, receivedFilter]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await inventoryApi.getAll({
                limit: 10000,
                type: apiType,
                brandId: brandFilter,
                search: debouncedSearch,
                startDate,
                endDate,
                receiptNumber,
                orderNumber
            });

            const rawMovements = Array.isArray(response) ? response : (response?.data || []);
            
            // Map and group logic (Parity with useInventory and groupedRows)
            const mapped = rawMovements.map((move: any) => {
                const order = move.order || {};
                const client = move.client || {};
                const payments = order.payments || [];
                const abono = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                const total = Number(order.realInvoiceTotal || order.total || 0);
                const saldo = Math.max(0, total - abono);

                return {
                    ...move,
                    totalQuantity: move.totalQuantity,
                    receiptNumber: order.receiptNumber || "N/A",
                    orderNumber: order.orderNumber || order.receiptNumber || "-",
                    emissionDate: order.createdAt,
                    createdByName: order.createdByName || "-",
                    brandName: order.brand?.name || move.brand?.name || "Unknown Brand",
                    orderType: order.type || "PEDIDO",
                    clientName: `${client.firstName} ${client.lastName || ''}`.trim() || order.clientName || "Unknown Client",
                    clientPhone1: client.phone1 || "-",
                    clientPhone2: client.phone2 || "-",
                    orderTotal: Number(order.total || 0),
                    invoiceTotal: total,
                    abono,
                    saldo,
                    invoiceNumber: order.invoiceNumber || "-",
                    possibleDeliveryDate: order.possibleDeliveryDate,
                    deliveryDate: order.deliveryDate,
                    daysInWarehouse: calculateDaysInWarehouse(move.createdAt, move.type === 'DELIVERED' ? move.createdAt : undefined),
                    status: move.type,
                    deliveryReceipt: order.packingNumber || "-", 
                };
            });

            // Grouping logic (Parity with groupedRows)
            const orderMap = new Map<string, any>();
            [...mapped].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).forEach(m => {
                if (!m.orderId) return;
                if (!orderMap.has(m.orderId)) {
                    orderMap.set(m.orderId, { ...m });
                } else {
                    const existing = orderMap.get(m.orderId);
                    existing.status = m.status;
                    if (m.type === 'ENTRY') existing.entryDate = m.createdAt;
                    if (m.type === 'DELIVERED') existing.deliveryDate = m.createdAt || m.deliveryDate;
                    if (m.type === 'RETURNED') existing.returnDate = m.createdAt;
                }
            });

            let filtered = Array.from(orderMap.values());
            if (deliveredFilter !== 'ALL') {
                const isDelivered = deliveredFilter === 'SI';
                filtered = filtered.filter(r => (r.status === 'DELIVERED') === isDelivered);
            }
            if (receivedFilter !== 'ALL') {
                const isReceived = receivedFilter === 'SI';
                filtered = filtered.filter(r => (r.status === 'ENTRY' || r.status === 'DELIVERED') === isReceived);
            }

            const exportedData = filtered.sort((a, b) => {
                const aDate = new Date(a.deliveryDate || a.returnDate || a.createdAt).getTime();
                const bDate = new Date(b.deliveryDate || b.returnDate || b.createdAt).getTime();
                return bDate - aDate;
            });

            await exportInventoryToExcel(exportedData, `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading && movements.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400 min-h-[400px]">
                <div className="h-10 w-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
                <span className="font-bold text-sm">Cargando inventario de pedidos...</span>
            </div>
        );
    }

    const hasFilters = debouncedSearch || startDate || endDate || receiptNumber || orderNumber || deliveredFilter !== 'ALL' || receivedFilter !== 'ALL' || brandFilter;

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Inventario de Pedidos" 
                description="Control físico, financiero y trazabilidad de paquetes"
                icon={Boxes}
                actions={
                    <Button 
                        onClick={handleExport}
                        disabled={isExporting || groupedRows.length === 0}
                        variant="outline"
                        className="rounded-xl border-slate-200 h-10 font-bold text-xs uppercase tracking-widest gap-2 bg-white shadow-sm hover:bg-slate-50 transition-all text-slate-600"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 text-emerald-600" />}
                        Exportar Excel
                    </Button>
                }
            />

            {/* KPI Cards */}
            <div className="flex flex-wrap gap-4 w-full">
                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[200px] flex-1">
                    <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                        <PackageSearch className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Por Recibir</p>
                        <p className="text-2xl font-black text-purple-600 tracking-tight leading-none">{stats?.pending || 0}</p>
                    </div>
                </div>

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

            <InventoryFilters
                search={searchTerm}
                onSearchChange={setSearchTerm}
                brandFilter={brandFilter}
                onBrandChange={setBrandFilter}
                brands={availableBrands}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                receiptNumber={receiptNumber}
                onReceiptNumberChange={setReceiptNumber}
                orderNumber={orderNumber}
                onOrderNumberChange={setOrderNumber}
                deliveredFilter={deliveredFilter}
                onDeliveredChange={setDeliveredFilter}
                receivedFilter={receivedFilter}
                onReceivedChange={setReceivedFilter}
                onClear={clearFilters}
            />

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
                    <InventoryTable 
                        movements={groupedRows} 
                        startIndex={(page - 1) * limit}
                    />
                </>
            )}

            {pagination && pagination.pages > 1 && (
                <div className="mt-6 flex justify-center pb-8">
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
