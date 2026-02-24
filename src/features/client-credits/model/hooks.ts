import { useQuery } from '@tanstack/react-query';
import { clientCreditApi } from '@/shared/api/clientCreditApi';
import { clientApi } from '@/shared/api/clientApi';
import type { ClientCreditSummary } from './types';

export function useClientCredits() {
    return useQuery({
        queryKey: ['client-credits-summary'],
        queryFn: async (): Promise<ClientCreditSummary[]> => {
            const clients = await clientApi.getAll();
            const summaries: ClientCreditSummary[] = [];

            for (const client of clients) {
                const credits = await clientCreditApi.getByClient(client.id);

                if (credits.length > 0) {
                    const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);

                    if (totalCredit > 0.01) {
                        summaries.push({
                            clientId: client.id,
                            clientName: client.firstName,
                            clientIdentification: client.identificationNumber,
                            clientPhone: client.phone1,
                            totalCredit: totalCredit,
                            totalGenerated: totalCredit,
                            totalUsed: 0,
                            lastUpdated: credits[credits.length - 1].createdAt,
                            credits: credits.map(c => ({
                                id: c.id,
                                amount: c.amount,
                                originTransactionId: c.originTransactionId,
                                createdAt: c.createdAt
                            }))
                        });
                    }
                }
            }

            return summaries.sort((a, b) => b.totalCredit - a.totalCredit);
        },
        staleTime: 30000,
    });
}

export function useClientCredit(clientId: string) {
    return useQuery({
        queryKey: ['client-credit', clientId],
        queryFn: async () => {
            const credits = await clientCreditApi.getByClient(clientId);
            const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);
            return {
                credits,
                totalCredit
            };
        },
        enabled: !!clientId,
    });
}
