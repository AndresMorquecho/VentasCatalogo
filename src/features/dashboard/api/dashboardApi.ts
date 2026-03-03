import type { DashboardData } from '../model/types';
import { httpClient } from '@/shared/lib/httpClient';

export const dashboardApi = {
    getDashboardMetrics: async (): Promise<DashboardData> => {
        try {
            return await httpClient.get<DashboardData>('/dashboard/summary');
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            throw error;
        }
    }
};
