import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/entities/order';

export interface DeliveryFilters {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    clientId?: string;
    orderNumber?: string;
    searchText?: string;
    page?: number;
    limit?: number;
}

export const useOrderDeliveryList = (filters?: DeliveryFilters) => {
    return useQuery({
        queryKey: ['orders', 'delivery-list', filters],
        queryFn: async () => {
            const page = filters?.page || 1;
            const limit = filters?.limit || 25;

            // Using getAll with status RECIBIDO_EN_BODEGA for server-side filtering
            const response = await orderApi.getAll({
                status: 'RECIBIDO_EN_BODEGA',
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                brandId: filters?.brandId === 'ALL' ? undefined : filters?.brandId,
                clientId: filters?.clientId,
                search: filters?.searchText || filters?.orderNumber,
                page,
                limit
            });
            
            return {
                data: response.data,
                pagination: response.pagination
            };
        }
    });
}

export const useOrderDeliveryHistory = (filters?: DeliveryFilters) => {
    return useQuery({
        queryKey: ['orders', 'delivery-history', filters],
        queryFn: async () => {
             const page = filters?.page || 1;
             const limit = filters?.limit || 25;

             // Using getAll with status ENTREGADO
             const response = await orderApi.getAll({
                status: 'ENTREGADO',
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                brandId: filters?.brandId === 'ALL' ? undefined : filters?.brandId,
                clientId: filters?.clientId,
                search: filters?.searchText || filters?.orderNumber,
                page,
                limit
            });

            return {
                data: response.data,
                pagination: response.pagination
            };
        }
    });
}
