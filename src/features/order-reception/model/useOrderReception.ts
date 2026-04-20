import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/entities/order/model/api';

export interface ReceptionFilters {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    searchText?: string;
    page?: number;
    limit?: number;
}

export const useOrderReceptionList = (filters?: ReceptionFilters) => {
    return useQuery({
        queryKey: ['orders', 'reception-list', filters],
        queryFn: async () => {
            const page = filters?.page || 1;
            const limit = filters?.limit || 25;

            const response = await orderApi.getAll({
                status: 'POR_RECIBIR,EN_TRANSITO',
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                brandId: filters?.brandId === 'all' ? undefined : filters?.brandId,
                search: filters?.searchText,
                page,
                limit
            });
            
            return {
                data: response.data,
                pagination: response.pagination
            };
        },
        staleTime: 0, // Always consider stale for this business-critical view
        refetchInterval: 30000, // Optional: Poll every 30s for small updates if the user stays on the page
        refetchOnWindowFocus: true // Useful if they switch tabs to create order
    });
};

// Hook for History
export const useOrderReceptionHistory = (filters?: ReceptionFilters) => {
    return useQuery({
        queryKey: ['orders', 'reception-history', filters],
        queryFn: async () => {
            const page = filters?.page || 1;
            const limit = filters?.limit || 25;

             // History: Recibidos en bodega o ya entregados (ambos pasaron por recepción)
             const response = await orderApi.getAll({
                status: 'RECIBIDO_EN_BODEGA,ENTREGADO',
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                brandId: filters?.brandId === 'all' ? undefined : filters?.brandId,
                search: filters?.searchText,
                page,
                limit
            });

            return {
                data: response.data,
                pagination: response.pagination
            };
        },
        staleTime: 0, // Always fresh when navigating to history
    });
};
