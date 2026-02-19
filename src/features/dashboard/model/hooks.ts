
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
// import { handleError } from '@/shared/lib/errorHandler'; // If we had one

export const useDashboard = (startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: ['dashboard-metrics', startDate, endDate],
        queryFn: async () => {
            try {
                const data = await dashboardApi.getDashboardMetrics(startDate, endDate);
                return data;
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes fresh
    });
};
