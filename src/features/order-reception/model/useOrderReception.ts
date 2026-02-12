import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/entities/order/model/api';
import type { Order } from '@/entities/order/model/types';

export interface ReceptionFilters {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    searchText?: string;
}

export const useOrderReceptionList = (filters?: ReceptionFilters) => {
    return useQuery({
        queryKey: ['orders', 'reception-list', filters],
        queryFn: async () => {
             const allOrders = await orderApi.getAll();
             let filtered = allOrders.filter((o: Order) => 
                 o.status === 'POR_RECIBIR' || o.status === 'ATRASADO'
             );

             if (!filters) return filtered;

             if (filters.startDate) {
                 filtered = filtered.filter(o => o.possibleDeliveryDate >= filters.startDate!);
             }
             if (filters.endDate) {
                 filtered = filtered.filter(o => o.possibleDeliveryDate <= filters.endDate!);
             }
             if (filters.brandId && filters.brandId !== 'all') {
                 filtered = filtered.filter(o => o.brandId === filters.brandId);
             }
             if (filters.searchText) {
                 const lower = filters.searchText.toLowerCase();
                 filtered = filtered.filter(o => 
                     o.clientName.toLowerCase().includes(lower) || 
                     o.receiptNumber.toLowerCase().includes(lower)
                 );
             }

             return filtered;
        }
    });
}

// Hook for History
export const useOrderReceptionHistory = (filters?: ReceptionFilters) => {
    return useQuery({
        queryKey: ['orders', 'reception-history', filters],
        queryFn: async () => {
             const allOrders = await orderApi.getAll();
             // History: Recibidos en bodega o entregados (ya pasaron por recepción)
             // Y que tengan fecha de recepción
             let filtered = allOrders.filter((o: Order) => 
                 (o.status === 'RECIBIDO_EN_BODEGA' || o.status === 'ENTREGADO') &&
                 o.receptionDate
             );

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
                 const lower = filters.searchText.toLowerCase();
                 filtered = filtered.filter(o => 
                     o.clientName.toLowerCase().includes(lower) || 
                     o.receiptNumber.toLowerCase().includes(lower) ||
                     (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(lower))
                 );
             }

             // Sort by reception date desc
             return filtered.sort((a, b) => new Date(b.receptionDate!).getTime() - new Date(a.receptionDate!).getTime());
        }
    });
}
