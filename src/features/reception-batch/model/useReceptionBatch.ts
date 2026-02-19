import { useState, useMemo } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query'; // Consolidated
import { useOrderList } from '@/entities/order/model/hooks';
import type { Order } from '@/entities/order/model/types';

import { receptionApi } from '@/shared/api/receptionApi';
import { useClientList } from '@/features/clients/api/hooks';

export type SelectedOrderState = {
    order: Order;
    abonoRecepcion: number;
    finalTotal: number;
    finalInvoiceNumber: string;
}

export function useReceptionBatch() {
    const { data: allOrders = [], isLoading } = useOrderList();
    const { data: clients = [] } = useClientList();
    const qc = useQueryClient();

    // Map OrderID -> { abono, total, invoiceNumber }
    const [selectionMap, setSelectionMap] = useState<Record<string, { abono: number, total: number, invoice: string }>>({});

    const selectedIds = useMemo(() => new Set(Object.keys(selectionMap)), [selectionMap]);

    // LEFT TABLE: Available orders
    const pendingOrders = useMemo(() => 
        allOrders.filter(o => o.status === 'POR_RECIBIR' && !selectedIds.has(o.id)), 
    [allOrders, selectedIds]);

    // RIGHT TABLE: Selected orders with local state
    const selectedOrders: SelectedOrderState[] = useMemo(() => {
        return allOrders
            .filter(o => selectedIds.has(o.id))
            .map(o => ({
                order: o,
                abonoRecepcion: selectionMap[o.id]?.abono ?? 0,
                finalTotal: selectionMap[o.id]?.total ?? (o.realInvoiceTotal || o.total),
                finalInvoiceNumber: selectionMap[o.id]?.invoice ?? (o.invoiceNumber || o.receiptNumber) // Default to receipt if no invoice
            }));
    }, [allOrders, selectedIds, selectionMap]);

    const moveToSelected = (ids: string[]) => {
        setSelectionMap(prev => {
            const next = { ...prev };
            ids.forEach(id => {
                const order = allOrders.find(o => o.id === id);
                if (order && !next[id]) {
                    // Initialize with defaults
                    next[id] = {
                        abono: 0, // Default abono 0 (user must enter)
                        total: order.realInvoiceTotal || order.total,
                        invoice: order.invoiceNumber || "" // Empty initially unless set
                    };
                }
            });
            return next;
        });
    };

    const updateAbono = (id: string, value: number) => {
        setSelectionMap(prev => {
             if (!prev[id]) return prev;
             return { ...prev, [id]: { ...prev[id], abono: value } };
        });
    };

    const updateInvoiceTotal = (id: string, value: number) => {
        setSelectionMap(prev => {
             if (!prev[id]) return prev;
             return { ...prev, [id]: { ...prev[id], total: value } };
        });
    };

    const updateInvoiceNumber = (id: string, value: string) => {
        setSelectionMap(prev => {
             if (!prev[id]) return prev;
             return { ...prev, [id]: { ...prev[id], invoice: value } };
        });
    };

    const moveToPending = (ids: string[]) => {
        setSelectionMap(prev => {
            const next = { ...prev };
            ids.forEach(id => delete next[id]);
            return next;
        });
    };

    const clearSelection = () => setSelectionMap({});

    const saveBatch = useMutation({
        mutationFn: async (ordersToSave: SelectedOrderState[]) => {
            if (ordersToSave.length === 0) throw new Error("No hay órdenes seleccionadas");
            // Call API with the enriched payload
            return receptionApi.saveBatchWithPayments(ordersToSave);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['orders'] });
            qc.invalidateQueries({ queryKey: ['financial-movements'] });
            qc.invalidateQueries({ queryKey: ['bank-accounts'] });
            clearSelection();
        }
    });

    return {
        allOrders,
        pendingOrders,
        selectedOrders,
        moveToSelected,
        moveToPending,
        updateAbono,
        updateInvoiceTotal,
        updateInvoiceNumber,
        clearSelection,
        saveBatch,
        isLoading,
        clients
    };
}
