import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/entities/order/model/api';
import { clientApi } from '@/shared/api/clientApi';
import type { Order } from '@/entities/order/model/types';
import { useToast } from '@/shared/ui/use-toast';

export const useReceptionBatch = () => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
    const [packingNumber, setPackingNumber] = useState('');
    const [packingTotal, setPackingTotal] = useState(0);
    const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
    const [lastSavedOrders, setLastSavedOrders] = useState<Order[] | null>(null);
    const [lastSavedBatch, setLastSavedBatch] = useState<any | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Pagination for Pending Orders
    const [pendingPage, setPendingPage] = useState(1);
    const [pendingLimit] = useState(5000);

    const [historyPage, setHistoryPage] = useState(1);
    const [historyLimit] = useState(5000);
    const [historyFilters, setHistoryFilters] = useState({
        startDate: '',
        endDate: '',
        brandId: 'ALL',
        packingNumber: '',
        type: 'all'
    });

    const [pendingFilters, setPendingFilters] = useState({
        receiptNumber: '',
        orderNumber: '',
        brandId: '',
        clientId: '',
        type: '',
        startDate: '',
        endDate: ''
    });

    // Queries
    // Query for PENDING orders with auto-refresh (real-time feel)
    const { data: pendingResponse, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['orders-pending-reception', pendingPage, pendingLimit, pendingFilters, selectedOrders.map(o => o.id).join(',')],
        queryFn: async () => {
            return await orderApi.getAll({ 
                status: 'POR_RECIBIR,EN_TRANSITO',
                page: pendingPage,
                limit: pendingLimit,
                excludeIds: selectedOrders.map(o => o.id),
                ...pendingFilters
            });
        },
        staleTime: 0,
        refetchInterval: 8000, 
        refetchOnWindowFocus: true,
        placeholderData: (previousData) => previousData
    });

    const allOrders = pendingResponse?.data || [];
    const pendingPagination = pendingResponse?.pagination;

    // Query for ALL clients to populate the SearchableSelect
    const { data: clientsResponse } = useQuery({
        queryKey: ['clients-for-reception'],
        queryFn: async () => {
            return await clientApi.getAll({ limit: 5000 });
        },
        staleTime: 60000 // Clients don't change that often
    });

    const clients = clientsResponse?.data || [];
    const clientOptions = clients.map(c => ({
        id: c.id,
        label: (c as any).firstName || 'Sin nombre',
        subLabel: c.identificationNumber
    }));

    const { data: batchesResponse, isLoading: isLoadingBatches } = useQuery({
        queryKey: ['reception-batches', historyPage, historyLimit, historyFilters],
        queryFn: () => orderApi.getReceptionBatches({
            page: historyPage,
            limit: historyLimit,
            ...historyFilters
        }),
        staleTime: 0,
        refetchInterval: 15000, 
        refetchOnWindowFocus: true,
    });

    const batches = batchesResponse?.data || [];
    const pagination = batchesResponse?.pagination;

    // Auto-generate on load (if not editing)
    useEffect(() => {
        if (!editingBatchId && !packingNumber) {
            orderApi.generatePackingNumber()
                .then(res => {
                    if (res?.packingNumber) {
                        setPackingNumber(res.packingNumber);
                    } else {
                        console.warn("[useReceptionBatch] API returned success but without packingNumber:", res);
                    }
                })
                .catch(err => {
                    console.error('CRITICAL: API de numeración falló con error de red o sesión:', err);
                });
        }
    }, [editingBatchId, packingNumber]);

    // Mutations
    const saveBatch = useMutation({
        mutationFn: async (data: { items: any[], packingNumber: string, packingTotal: number, id?: string, attempt?: number }) => {
            try {
                return await orderApi.batchReception(data.items, { 
                    packingNumber: data.packingNumber, 
                    packingTotal: data.packingTotal,
                    id: data.id
                });
            } catch (error: any) {
                const errorMsg = error?.message?.toLowerCase() || "";
                const isIdConflict = errorMsg.includes('packing') || errorMsg.includes('existe') || error?.status === 409;
                
                // Si es un conflicto de Packing y nos quedan intentos, reintentamos con un número nuevo
                if (isIdConflict && (data.attempt || 0) < 1) {
                    console.warn("Packing conflict. Retrying...");
                    const res = await orderApi.generatePackingNumber();
                    setPackingNumber(res.packingNumber);
                    
                    return await orderApi.batchReception(data.items, { 
                        packingNumber: res.packingNumber, 
                        packingTotal: data.packingTotal,
                        id: data.id
                    });
                }
                throw error;
            }
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['orders-pending-reception'] });
            queryClient.invalidateQueries({ queryKey: ['reception-batches'] });
            
            if (!editingBatchId) {
                orderApi.generatePackingNumber().then(res => {
                    setPackingNumber(res.packingNumber);
                });
            }
            
            // Invalidate full orders and financial records cache to reflect distributive payments
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['financial-records'] });
            queryClient.invalidateQueries({ queryKey: ['client-credits'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-history'] });
            
            // Si la API retorna un objeto { batch, orders }
            const orders = data.orders || data;
            setLastSavedOrders(Array.isArray(orders) ? orders : null);
            setLastSavedBatch({
                packingNumber,
                packingTotal,
                id: data.batchId || data.id // Use batchId from response if available
            });

            setSelectedOrders([]);
            // setPackingNumber(''); // Don't clear it, wait for refresh
            setPackingTotal(0);
            setEditingBatchId(null);
            showToast(editingBatchId ? 'Packing actualizado' : 'Pedidos recepcionados correctamente', 'success');
        },
        onError: (error: any) => {
            console.error("[BatchReception] Error Details:", error);
            const errorMsg = (error?.message || error?.error || "").toLowerCase();
            
            // Detectar conflictos de forma extrema
            const isStatusConflict = /recibido|estado|permite|recep|válido|conflict/.test(errorMsg);
            const isPackingConflict = /packing|existe|duplicado/.test(errorMsg) || error?.status === 409;

            // Independientemente del tipo de error, si falló en modo NO edición, actualizamos el N° de packing
            // para estar seguros de que el usuario vea el consecutivo más reciente.
            if (!editingBatchId) {
                console.log("[BatchReception] Fetching fresh packing number after error...");
                orderApi.generatePackingNumber().then(res => {
                    console.log("[BatchReception] New number received from API:", res.packingNumber);
                    setPackingNumber(res.packingNumber);
                });
            }

            if (isStatusConflict || isPackingConflict) {
                if (isStatusConflict) {
                    showToast("¡Conflicto de Pedidos! Refrescando lista y número de packing...", "error");
                    queryClient.refetchQueries({ queryKey: ['orders-pending-reception'] });
                    
                    // Asegurar limpieza de la zona de recepción
                    setSelectedOrders([]);
                    setPackingTotal(0);
                } else {
                    showToast("El N° de Packing actual ya existe o es inválido. El sistema generó uno nuevo.", "error");
                }
            } else {
                showToast(error.message || 'Error al procesar recepción', 'error');
            }
        },
    });

    const deleteBatch = useMutation({
        mutationFn: (id: string) => orderApi.deleteReceptionBatch(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders-pending-reception'] });
            queryClient.invalidateQueries({ queryKey: ['reception-batches'] });
            showToast('Recepción revertida. Los pedidos han regresado a pendientes.', 'success');
        },
        onError: (error: any) => {
            showToast(error.message || 'Error al eliminar el lote', 'error');
        },
    });

    // Actions
    const addOrders = (ids: string[]) => {
        const toAdd = allOrders.filter(o => ids.includes(o.id) && !selectedOrders.find(so => so.id === o.id));
        setSelectedOrders(prev => [
            ...prev,
            ...toAdd.map(o => ({
                ...o,
                finalTotal: Number(o.total),
                finalInvoiceNumber: '',
                documentType: 'FACTURA',
                entryDate: new Date().toISOString().split('T')[0]
            }))
        ]);
    };

    // Add fully-formed order objects directly (e.g. from exchange batch)
    const addOrdersDirectly = (orders: any[]) => {
        setSelectedOrders(prev => {
            const existingIds = new Set(prev.map(o => o.id));
            const toAdd = orders.filter(o => !existingIds.has(o.id));
            return [...prev, ...toAdd];
        });
    };

    const removeOrder = (orderId: string) => {
        setSelectedOrders(selectedOrders.filter(o => o.id !== orderId));
    };

    const startEditingBatch = (batch: any) => {
        setEditingBatchId(batch.id);
        setPackingNumber(batch.packingNumber);
        setPackingTotal(Number(batch.packingTotal));
        
        // Cargar los pedidos del batch a la zona de selección
        const batchOrders = batch.orders.map((o: any) => ({
            ...o,
            finalTotal: Number(o.realInvoiceTotal),
            finalInvoiceNumber: o.invoiceNumber,
            documentType: o.documentType || 'FACTURA'
        }));
        
        setSelectedOrders(batchOrders);
    };

    const cancelEdit = () => {
        setEditingBatchId(null);
        setSelectedOrders([]);
        orderApi.generatePackingNumber().then(res => {
            setPackingNumber(res.packingNumber);
        });
        setPackingTotal(0);
    };

    const handleSaveBatch = () => {
        const items = selectedOrders.map(o => ({
            orderId: o.id,
            finalTotal: (o as any).finalTotal || Number(o.total),
            finalInvoiceNumber: (o as any).finalInvoiceNumber || '',
            documentType: (o as any).documentType || 'FACTURA',
            abonoRecepcion: (o as any).abonoRecepcion || 0,
            bankAccountId: (o as any).bankAccountId,
            paymentMethod: (o as any).paymentMethod || 'EFECTIVO',
            referenceNumber: (o as any).referenceNumber,
            entryDate: (o as any).entryDate,
            fromExchangeBatch: (o as any).fromExchangeBatch || false,
        }));

        saveBatch.mutate({
            items,
            packingNumber,
            packingTotal,
            id: editingBatchId || undefined
        });
    };

    const updateOrderItem = (orderId: string, data: Partial<any>) => {
        setSelectedOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, ...data } : o
        ));
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await orderApi.getAll({
                status: 'POR_RECIBIR,EN_TRANSITO',
                ...pendingFilters,
                limit: undefined // Fetch everything for export
            });
            return response.data || [];
        } catch (error) {
            console.error("Export Error:", error);
            showToast("Error al obtener datos para exportar", "error");
            return [];
        } finally {
            setIsExporting(false);
        }
    };

    return {
        allOrders: allOrders,
        selectedOrders,
        packingNumber,
        packingTotal,
        setPackingNumber,
        setPackingTotal,
        addOrders,
        removeOrder,
        handleSaveBatch,
        isSaving: saveBatch.isPending,
        batches,
        isLoadingBatches,
        deleteBatch: (id: string) => deleteBatch.mutate(id),
        isDeleting: deleteBatch.isPending,
        editingBatchId,
        startEditingBatch,
        cancelEdit,
        isLoadingOrders,
        updateOrderItem,
        addOrdersDirectly,
        lastSavedOrders,
        lastSavedBatch,
        clearLastSaved: () => {
            setLastSavedOrders(null);
            setLastSavedBatch(null);
        },
        handleExport,
        isExporting,
        // Pagination & Filters
        historyPage,
        setHistoryPage,
        historyLimit,
        historyFilters,
        setHistoryFilters,
        pagination,
        // Pending Pagination
        pendingPage,
        setPendingPage,
        pendingPagination,
        pendingFilters,
        setPendingFilters,
        clientOptions,
    };
};
