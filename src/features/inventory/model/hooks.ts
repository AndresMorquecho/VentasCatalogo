import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/shared/api/inventoryApi";

import { calculateDaysInWarehouse } from "../lib/calculateDaysInWarehouse";
import { useClients } from "@/entities/client/model/hooks";
import { useOrderList } from "@/entities/order/model/hooks";

// Hook to manage Inventory State
export const useInventory = () => {
    // 1️⃣ Fetch raw movements
    const { data: movements = [], isLoading } = useQuery({
        queryKey: ["inventory-movements"],
        queryFn: inventoryApi.getAll,
    });

    // 2️⃣ Fetch Clients & Orders for Display Data (Only for Names)
    const { data: clients = [] } = useClients();
    const { data: orders = [] } = useOrderList();

    // 3️⃣ Map IDs to Names for individual movements
    const inventoryData = useMemo(() => {
        return movements.map(move => {
            const client = clients.find(c => c.id === move.clientId);
            const order = orders.find(o => o.id === move.orderId);

            return {
                ...move,
                clientName: client ? `${client.firstName}` : "Unknown Client",
                brandName: order ? order.brandName : "Unknown Brand",
                orderCode: order ? order.receiptNumber : "N/A",
                daysInWarehouse: calculateDaysInWarehouse(move.createdAt, move.type === 'DELIVERED' ? move.createdAt : undefined),
                status: move.type,
            };
        });
    }, [movements, clients, orders]);

    // 4️⃣ Compute Dashboard Counters
    const inWarehouseCount = inventoryData.filter(i => i.status === 'ENTRY').length;
    const deliveredTodayCount = inventoryData.filter(i => i.status === 'DELIVERED' && new Date(i.createdAt).toDateString() === new Date().toDateString()).length;
    const longStorageCount = inventoryData.filter(i => i.daysInWarehouse > 10 && i.status === 'ENTRY').length;

    return {
        movements: inventoryData,
        isLoading,
        stats: {
            inWarehouse: inWarehouseCount,
            deliveredToday: deliveredTodayCount,
            longStorage: longStorageCount,
        }
    };
};
