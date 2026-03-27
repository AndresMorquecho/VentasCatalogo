import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/entities/order';

export interface DeliveryFilters {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    clientId?: string;
    orderNumber?: string;
    invoiceNumber?: string;
    creditNoteNumber?: string;
    searchText?: string;
    page?: number;
    limit?: number;
    enabled?: boolean;
    status?: string;
}

export const useOrderDeliveryList = (filters?: DeliveryFilters) => {
    const isEnabled = filters?.enabled !== false;
    
    return useQuery({
        queryKey: ['orders', 'delivery-list', filters],
        enabled: isEnabled,
        queryFn: async () => {
            const page = filters?.page || 1;
            const limit = filters?.limit || 25;

            // Using getAll with status the provided status or fallback to RECIBIDO_EN_BODEGA
            const response = await orderApi.getAll({
                status: (filters?.status as any) || 'RECIBIDO_EN_BODEGA',
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                brandId: filters?.brandId === 'ALL' ? undefined : filters?.brandId,
                clientId: filters?.clientId,
                search: filters?.searchText || filters?.orderNumber || filters?.invoiceNumber || filters?.creditNoteNumber,
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
                search: filters?.searchText || filters?.orderNumber || filters?.invoiceNumber || filters?.creditNoteNumber,
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

export const useDeliveryPendingOptions = () => {
    return useQuery({
        queryKey: ['orders', 'delivery-pending-options'],
        queryFn: async () => {
            // Fetch a larger sample of pending orders to extract unique clients and brands
            const response = await orderApi.getAll({
                status: 'RECIBIDO_EN_BODEGA',
                limit: 1000 // Large limit to get most pending items
            });
            
            const orders = response.data;
            
            // Extract unique clients
            const clientsMap = new Map();
            orders.forEach(o => {
                if (o.clientId && !clientsMap.has(o.clientId)) {
                    clientsMap.set(o.clientId, {
                        id: o.clientId,
                        firstName: o.clientName,
                        identificationNumber: '-' 
                    });
                }
            });
            
            // Extract unique brands
            const brandsMap = new Map();
            orders.forEach(o => {
                if (o.brandId && !brandsMap.has(o.brandId)) {
                    brandsMap.set(o.brandId, {
                        id: o.brandId,
                        name: o.brandName
                    });
                }
            });
            
            return {
                clients: Array.from(clientsMap.values()),
                brands: Array.from(brandsMap.values())
            };
        }
    });
}
