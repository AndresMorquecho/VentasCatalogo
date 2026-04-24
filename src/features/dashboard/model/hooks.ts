import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardFilters } from '../api/dashboardApi';

export const useDashboard = (filters: DashboardFilters = {}) => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['dashboard', 'summary', filters.brandId, filters.dateFrom?.toISOString(), filters.dateTo?.toISOString()],
        queryFn: () => dashboardApi.getDashboardMetrics(filters),
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: true
    });

    return {
        data: data || null,
        isLoading,
        isError,
        refetch
    };
};
