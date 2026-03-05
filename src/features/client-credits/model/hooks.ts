import { useQuery } from '@tanstack/react-query';
import { clientCreditApi } from '@/shared/api/clientCreditApi';
import type { ClientCreditSummary } from './types';

export function useClientCredits() {
    return useQuery({
        queryKey: ['client-credits-summary'],
        queryFn: async (): Promise<ClientCreditSummary[]> => {
            return clientCreditApi.getSummary();
        },
        staleTime: 30000,
    });
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
