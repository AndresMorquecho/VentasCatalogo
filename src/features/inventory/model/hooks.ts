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
                // BASIC INFO
                receiptNumber: order.receiptNumber || "N/A",
                orderNumber: order.orderNumber || order.receiptNumber || "-",
                emissionDate: order.createdAt,
                createdByName: order.createdByName || "-",
                brandName: order.brand?.name || move.brand?.name || "Unknown Brand",
                
                // CLIENT INFO
                clientName: `${client.firstName} ${client.lastName || ''}`.trim() || order.clientName || "Unknown Client",
                clientIdentification: client.identificationNumber || "-",
                clientPhone: [client.phone1, client.phone2].filter(Boolean).join(" / ") || "-",
                
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

    // 3️⃣ Compute Dashboard Counters (Current view only if paginated)
    const inWarehouseCount = inventoryData.filter(i => i.status === 'ENTRY').length;
    const deliveredTodayCount = inventoryData.filter(i => i.status === 'DELIVERED' && new Date(i.createdAt).toDateString() === new Date().toDateString()).length;
    const longStorageCount = inventoryData.filter(i => i.daysInWarehouse > 10 && i.status === 'ENTRY').length;

    return {
        movements: inventoryData,
        isLoading,
        refetch,
        pagination: response && !Array.isArray(response) ? response.pagination : undefined,
        stats: {
            inWarehouse: inWarehouseCount,
            deliveredToday: deliveredTodayCount,
            longStorage: longStorageCount,
        }
    };
};

