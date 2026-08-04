import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/shared/api/inventoryApi";

import { calculateDaysInWarehouse } from "../lib/calculateDaysInWarehouse";

// Hook to manage Inventory State
export const useInventory = (params?: { 
    page?: number; 
    limit?: number; 
    type?: string; 
    brandId?: string; 
    orderId?: string;
    startDate?: string;
    endDate?: string;
    receiptNumber?: string;
    orderNumber?: string;
    orderType?: string;
    search?: string;
}) => {
    // 1️⃣ Fetch raw movements with navigation properties
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ["inventory-movements", params],
        queryFn: () => inventoryApi.getAll(params),
        placeholderData: (prev) => prev
    });

    const movements = Array.isArray(response) ? response : (response?.data || []);

    // 2️⃣ Map navigation properties to flattened fields for UI components
    const inventoryData = useMemo(() => {
        return movements.map(move => {
            const order = move.order || {};
            const client = move.client || {};
            const payments = order.payments || [];
            const abono = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const total = Number(order.realInvoiceTotal || order.total || 0);
            const saldo = Math.max(0, total - abono);

            return {
                ...move,
                totalQuantity: move.totalQuantity,
                // BASIC INFO
                receiptNumber: order.receiptNumber || "N/A",
                orderNumber: order.orderNumber || order.receiptNumber || "-",
                emissionDate: order.createdAt,
                createdByName: order.createdByName || "-",
                brandName: order.brand?.name || move.brand?.name || "Unknown Brand",
                orderType: order.type || "PEDIDO",
                
                // CLIENT INFO
                clientName: `${client.firstName} ${client.lastName || ''}`.trim() || order.clientName || "Unknown Client",
                clientIdentification: client.identificationNumber || "-",
                clientPhone: [client.phone1, client.phone2].filter(Boolean).join(" / ") || "-",
                clientPhone1: client.phone1 || "-",
                clientPhone2: client.phone2 || "-",
                
                // FINANCIALS
                orderTotal: Number(order.total || 0),
                invoiceTotal: total,
                abono,
                saldo,
                invoiceNumber: order.invoiceNumber || "-",
                
                // DATES & STORAGE
                possibleDeliveryDate: order.possibleDeliveryDate,
                deliveryDate: order.deliveryDate,
                daysInWarehouse: calculateDaysInWarehouse(move.createdAt, move.type === 'DELIVERED' ? move.createdAt : undefined),
                status: move.type,
                processedBy: move.createdBy || order.receivedByName || "-",
                deliveryReceipt: order.packingNumber || "-", 
            };
        });
    }, [movements]);

    // 3️⃣ Dashboard Counters (Prefer API stats if available, otherwise fallback to local)
    const todayEcuador = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
    const stats = response && !Array.isArray(response) && response.stats ? response.stats : {
        pending: inventoryData.filter(i => i.status === 'POR_RECIBIR' || i.status === 'PENDING').length,
        inWarehouse: inventoryData.filter(i => i.status === 'ENTRY').length,
        deliveredToday: inventoryData.filter(i => i.status === 'DELIVERED' && (
            i.deliveryDate 
                ? new Date(i.deliveryDate).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }) === todayEcuador
                : new Date(i.createdAt).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }) === todayEcuador
        )).length,
        longStorage: inventoryData.filter(i => i.daysInWarehouse > 10 && (i.status === 'ENTRY')).length,
    };
 
    return {
        movements: inventoryData,
        isLoading,
        refetch,
        pagination: response && !Array.isArray(response) ? response.pagination : undefined,
        stats
    };
};
