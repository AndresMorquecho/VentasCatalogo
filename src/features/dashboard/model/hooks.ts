import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';

export const useDashboard = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['dashboard', 'summary'],
        queryFn: () => dashboardApi.getDashboardMetrics(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true
    });

    return {
        data: data || null,
        isLoading,
        isError,
        refetch
    };
};
