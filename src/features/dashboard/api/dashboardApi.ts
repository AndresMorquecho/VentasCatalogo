import type { DashboardData } from '../model/types';
import { httpClient } from '@/shared/lib/httpClient';

export interface DashboardFilters {
    brandId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export const dashboardApi = {
    getDashboardMetrics: async (filters: DashboardFilters = {}): Promise<DashboardData> => {
        const params = new URLSearchParams();
        if (filters.brandId) params.set('brandId', filters.brandId);
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString().split('T')[0]);
        if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString().split('T')[0]);

        const query = params.toString() ? `?${params.toString()}` : '';
        try {
            return await httpClient.get<DashboardData>(`/dashboard/summary${query}`);
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            throw error;
        }
    }
};
