import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/entities/order/model/api';
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

    // Queries
    const { data: allOrders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['orders-pending-reception'],
        queryFn: () => orderApi.getByStatus('POR_RECIBIR'),
    });

    const { data: batches = [], isLoading: isLoadingBatches } = useQuery({
        queryKey: ['reception-batches'],
        queryFn: () => orderApi.getReceptionBatches(),
    });

    // Mutations
    const saveBatch = useMutation({
        mutationFn: (data: { items: any[], packingNumber: string, packingTotal: number, id?: string }) => 
            orderApi.batchReception(data.items, { 
                packingNumber: data.packingNumber, 
                packingTotal: data.packingTotal,
                id: data.id
            }),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['orders-pending-reception'] });
            queryClient.invalidateQueries({ queryKey: ['reception-batches'] });
            
            // Si la API retorna un objeto { batch, orders }
            const orders = data.orders || data;
            setLastSavedOrders(Array.isArray(orders) ? orders : null);
            setLastSavedBatch({
                packingNumber,
                packingTotal,
                id: data.batchId || data.id // Use batchId from response if available
            });

            setSelectedOrders([]);
            setPackingNumber('');
            setPackingTotal(0);
            setEditingBatchId(null);
            showToast(editingBatchId ? 'Packing actualizado' : 'Pedidos recepcionados correctamente', 'success');
        },
        onError: (error: any) => {
            showToast(error.message || 'Error al procesar recepción', 'error');
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
        setPackingNumber('');
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
            entryDate: (o as any).entryDate
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

    return {
        allOrders: allOrders.filter(o => !selectedOrders.find(so => so.id === o.id)),
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
        lastSavedOrders,
        lastSavedBatch,
        clearLastSaved: () => {
            setLastSavedOrders(null);
            setLastSavedBatch(null);
        }
    };
};
