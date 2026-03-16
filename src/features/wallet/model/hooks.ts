import { useQuery } from '@tanstack/react-query';
import { clientCreditApi } from '@/shared/api/clientCreditApi';


export function useClientCredits(params?: { page?: number; limit?: number; search?: string }) {
    const { data: response, isLoading } = useQuery({
        queryKey: ['client-credits-summary', params],
        queryFn: async () => {
            return clientCreditApi.getSummary(params?.page, params?.limit, params?.search);
        },
        staleTime: 30000,
        placeholderData: (prev) => prev
    });

    return {
        summaries: response?.data || [],
        pagination: response?.pagination,
        isLoading
    };
}


export function useClientCredit(clientId: string) {
    return useQuery({
        queryKey: ['client-credit', clientId],
        queryFn: async () => {
            const credits = await clientCreditApi.getAvailableByClient(clientId);
            const totalCredit = credits.reduce((sum, c) => sum + Number(c.remainingAmount), 0);
            return {
                credits,
                totalCredit
            };
        },
        enabled: !!clientId,
    });
}
