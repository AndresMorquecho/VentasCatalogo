
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/entities/order';

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
            const deliveryOrders = await orderApi.getDeliveryList();
            let filtered = [...deliveryOrders];

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

export const useOrderDeliveryHistory = (filters?: DeliveryFilters) => {
    return useQuery({
        queryKey: ['orders', 'delivery-history', filters],
        queryFn: async () => {
            const history = await orderApi.getDeliveryHistory();
            let filtered = [...history];

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
