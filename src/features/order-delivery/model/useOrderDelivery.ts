import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/entities/order/model/api';
import type { Order } from '@/entities/order/model/types';

export interface DeliveryFilters {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    searchText?: string;
}

export const useOrderDeliveryList = (filters?: DeliveryFilters) => {
    return useQuery({
        queryKey: ['orders', 'delivery-list', filters],
        queryFn: async () => {
             const allOrders = await orderApi.getAll();
             // Filter for orders ready to be delivered (In Warehouse)
             let filtered = allOrders.filter((o: Order) => o.status === 'RECIBIDO_EN_BODEGA');

             if (!filters) return filtered;

             if (filters.startDate) {
                 filtered = filtered.filter(o => o.receptionDate! >= filters.startDate!);
             }
             if (filters.endDate) {
                 filtered = filtered.filter(o => o.receptionDate! <= filters.endDate!);
             }
             if (filters.brandId && filters.brandId !== 'all') {
                 filtered = filtered.filter(o => o.brandId === filters.brandId);
             }
             if (filters.searchText) {
                 const lower = filters.searchText!.toLowerCase();
                 filtered = filtered.filter(o => 
                     o.clientName.toLowerCase().includes(lower) || 
                     o.receiptNumber.toLowerCase().includes(lower)
                 );
             }

             return filtered.sort((a, b) => new Date(a.receptionDate!).getTime() - new Date(b.receptionDate!).getTime());
        }
    });
}

// Hook for Delivery History
export const useOrderDeliveryHistory = (filters?: DeliveryFilters) => {
    return useQuery({
        queryKey: ['orders', 'delivery-history', filters],
        queryFn: async () => {
             const allOrders = await orderApi.getAll();
             let filtered = allOrders.filter((o: Order) => 
                 o.status === 'ENTREGADO' && o.deliveryDate
             );

             if (!filters) return filtered;

             if (filters.startDate) {
                 filtered = filtered.filter(o => o.deliveryDate! >= filters.startDate!);
             }
             if (filters.endDate) {
                 filtered = filtered.filter(o => o.deliveryDate! <= filters.endDate!);
             }
             if (filters.brandId && filters.brandId !== 'all') {
                 filtered = filtered.filter(o => o.brandId === filters.brandId);
             }
             if (filters.searchText) {
                 const lower = filters.searchText!.toLowerCase();
                 filtered = filtered.filter(o => 
                     o.clientName.toLowerCase().includes(lower) || 
                     o.receiptNumber.toLowerCase().includes(lower)
                 );
             }

             return filtered.sort((a, b) => new Date(b.deliveryDate!).getTime() - new Date(a.deliveryDate!).getTime());
        }
    });
}
