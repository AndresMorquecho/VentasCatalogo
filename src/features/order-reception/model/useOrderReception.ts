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

            // Using getAll with statuses for pending reception
            // We pass multiple statuses or the backend might handle 'POR_RECIBIR' 
            // but the original logic was: POR_RECIBIR || (RECIBIDO_EN_BODEGA && !deliveryDate)
            // The backend 'getAll' with status 'POR_RECIBIR' should be enough if the flow is correct.
            const response = await orderApi.getAll({
                status: 'POR_RECIBIR',
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
        }
    });
}

// Hook for History
export const useOrderReceptionHistory = (filters?: ReceptionFilters) => {
    return useQuery({
        queryKey: ['orders', 'reception-history', filters],
        queryFn: async () => {
            const page = filters?.page || 1;
            const limit = filters?.limit || 25;

             // History: Recibidos en bodega o entregados
             // We use a custom search or the backend might need to handle 'RECIBIDO_EN_BODEGA'
             const response = await orderApi.getAll({
                status: 'RECIBIDO_EN_BODEGA', // This usually covers history of receptions
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
        }
    });
}
