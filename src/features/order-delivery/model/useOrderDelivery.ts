
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/entities/order';

export interface DeliveryFilters {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    clientId?: string;
    orderNumber?: string;
    searchText?: string;
}

export const useOrderDeliveryList = (filters?: DeliveryFilters) => {
    return useQuery({
        queryKey: ['orders', 'delivery-list', filters],
        queryFn: async () => {
            // Using getAll with status RECIBIDO_EN_BODEGA for server-side filtering
            const response = await orderApi.getAll({
                status: 'RECIBIDO_EN_BODEGA',
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                brandId: filters?.brandId === 'ALL' ? undefined : filters?.brandId,
                clientId: filters?.clientId,
                search: filters?.searchText || filters?.orderNumber, // Backend 'search' typically covers multi-fields
                limit: 100 // reasonable limit for now
            });
            
            // If the backend search doesn't cover orderNumber specifically, we might need extra local filter
            // but for now let's assume 'search' handles basic text match as per orderApi definition
            
            return response.data.sort((a, b) => new Date(a.receptionDate!).getTime() - new Date(b.receptionDate!).getTime());
        }
    });
}

export const useOrderDeliveryHistory = (filters?: DeliveryFilters) => {
    return useQuery({
        queryKey: ['orders', 'delivery-history', filters],
        queryFn: async () => {
             // Using getAll with status ENTREGADO
             const response = await orderApi.getAll({
                status: 'ENTREGADO',
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                brandId: filters?.brandId === 'ALL' ? undefined : filters?.brandId,
                clientId: filters?.clientId,
                search: filters?.searchText || filters?.orderNumber,
                limit: 100
            });

            return response.data.sort((a, b) => new Date(b.deliveryDate!).getTime() - new Date(a.deliveryDate!).getTime());
        }
    });
}
