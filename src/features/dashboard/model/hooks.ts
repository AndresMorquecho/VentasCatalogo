import { useQueries } from '@tanstack/react-query';
import { orderApi } from '@/entities/order/model/api';
import { financialRecordApi } from '@/entities/financial-record/model/api';
import { clientApi } from '@/shared/api/clientApi';
import { rewardsApi } from '@/entities/client-reward/api/rewardsApi';
import { dashboardApi } from '../api/dashboardApi';

export const useDashboard = () => {
    // We use useQueries to fetch everything in parallel or individual useQuery calls
    // Using the same keys as the individual modules ensures they share the cache!
    const results = useQueries({
        queries: [
            { queryKey: ['orders', 'list'], queryFn: orderApi.getAll, staleTime: 5 * 60 * 1000 },
            { queryKey: ['financial-records'], queryFn: financialRecordApi.getAll, staleTime: 5 * 60 * 1000 },
            { queryKey: ['clients'], queryFn: clientApi.getAll, staleTime: 5 * 60 * 1000 },
            { queryKey: ['rewards'], queryFn: rewardsApi.getAll, staleTime: 5 * 60 * 1000 }
        ]
    });

    const isLoading = results.some(r => r.isLoading);
    const isError = results.some(r => r.isError);

    const [orders, financialRecords, clients, rewards] = results.map(r => r.data);

    // If we have all the data, we process it using the dashboard logic
    // but we use the static processor part of dashboardApi if possible
    const data = (orders && financialRecords && clients && rewards)
        ? dashboardApi.processData(orders, financialRecords, clients, rewards)
        : null;

    return {
        data,
        isLoading,
        isError,
        refetch: () => results.forEach(r => r.refetch())
    };
};
