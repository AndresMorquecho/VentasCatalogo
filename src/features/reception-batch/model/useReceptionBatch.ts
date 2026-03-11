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
    documentType: string;
    entryDate: string;
}

export function useReceptionBatch() {
    const { data: ordersResponse, isLoading } = useOrderList({ limit: 500 });
    const { data: clientsResponse } = useClientList({ limit: 500 });

    const allOrders = ordersResponse?.data || [];
    const clients = clientsResponse?.data || [];
    const qc = useQueryClient();

    const [packingNumber, setPackingNumber] = useState("");
    const [packingTotal, setPackingTotal] = useState(0);

    // Map OrderID -> { abono, total, invoiceNumber, documentType, entryDate }
    const [selectionMap, setSelectionMap] = useState<Record<string, { 
        abono: number, 
        total: number, 
        invoice: string,
        documentType: string,
        entryDate: string
    }>>({});

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
                finalInvoiceNumber: selectionMap[o.id]?.invoice ?? (o.invoiceNumber || o.receiptNumber),
                documentType: selectionMap[o.id]?.documentType ?? "FACTURA",
                entryDate: selectionMap[o.id]?.entryDate ?? new Date().toISOString().split('T')[0]
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
                        abono: 0,
                        total: order.realInvoiceTotal || order.total,
                        invoice: order.invoiceNumber || "",
                        documentType: "FACTURA",
                        entryDate: new Date().toISOString().split('T')[0]
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

    const updateDocumentType = (id: string, value: string) => {
        setSelectionMap(prev => {
            if (!prev[id]) return prev;
            return { ...prev, [id]: { ...prev[id], documentType: value } };
        });
    };

    const updateEntryDate = (id: string, value: string) => {
        setSelectionMap(prev => {
            if (!prev[id]) return prev;
            return { ...prev, [id]: { ...prev[id], entryDate: value } };
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
        mutationFn: async (params: {
            ordersToSave: SelectedOrderState[],
            paymentMethod?: string,
            bankAccountId?: string,
            referenceNumber?: string,
            packingNumber?: string,
            packingTotal?: number
        }) => {
            if (params.ordersToSave.length === 0) throw new Error("No hay órdenes seleccionadas");
            // Call API with the enriched payload
            return receptionApi.saveBatchWithPayments({
                selectedOrders: params.ordersToSave,
                paymentMethod: params.paymentMethod,
                bankAccountId: params.bankAccountId,
                referenceNumber: params.referenceNumber,
                packingNumber: params.packingNumber,
                packingTotal: params.packingTotal
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['orders'] });
            qc.invalidateQueries({ queryKey: ['financial-records'] });
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
        updateDocumentType,
        updateEntryDate,
        clearSelection,
        saveBatch,
        isLoading,
        clients,
        packingNumber,
        setPackingNumber,
        packingTotal,
        setPackingTotal
    };
}
