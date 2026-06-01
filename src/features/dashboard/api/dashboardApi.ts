import type { DashboardData } from '../model/types';
import { httpClient } from '@/shared/lib/httpClient';

export interface DashboardFilters {
    brandIds?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    period?: 'daily' | 'weekly' | 'monthly';
}

export const dashboardApi = {
    getDashboardMetrics: async (filters: DashboardFilters = {}): Promise<DashboardData> => {
        const params = new URLSearchParams();
        if (filters.brandIds && filters.brandIds.length > 0) {
            params.set('brandIds', filters.brandIds.join(','));
        }
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString().split('T')[0]);
        if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString().split('T')[0]);
        if (filters.period) params.set('period', filters.period);

        const query = params.toString() ? `?${params.toString()}` : '';
        try {
            return await httpClient.get<DashboardData>(`/dashboard/summary${query}`);
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            throw error;
        }
    }
};
