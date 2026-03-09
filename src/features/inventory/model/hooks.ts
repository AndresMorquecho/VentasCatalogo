import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/shared/api/inventoryApi";

import { calculateDaysInWarehouse } from "../lib/calculateDaysInWarehouse";

// Hook to manage Inventory State
export const useInventory = (params?: { page?: number; limit?: number; type?: string; brandId?: string; orderId?: string }) => {
    // 1️⃣ Fetch raw movements with navigation properties
    const { data: response, isLoading } = useQuery({
        queryKey: ["inventory-movements", params],
        queryFn: () => inventoryApi.getAll(params),
        placeholderData: (prev) => prev
    });

    const movements = Array.isArray(response) ? response : (response?.data || []);

    // 2️⃣ Map navigation properties to flattened fields for UI components
    const inventoryData = useMemo(() => {
        return movements.map(move => {
            return {
                ...move,
                clientName: move.client?.firstName || "Unknown Client",
                brandName: move.order?.brandName || "Unknown Brand",
                orderCode: move.order?.receiptNumber || "N/A",
                daysInWarehouse: calculateDaysInWarehouse(move.createdAt, move.type === 'DELIVERED' ? move.createdAt : undefined),
                status: move.type,
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
        pagination: response && !Array.isArray(response) ? response.pagination : undefined,
        stats: {
            inWarehouse: inWarehouseCount,
            deliveredToday: deliveredTodayCount,
            longStorage: longStorageCount,
        }
    };
};

