import { useQuery } from '@tanstack/react-query';
import { clientCreditApi } from '@/shared/api/transactionApi';
import { clientApi } from '@/shared/api/clientApi';
import type { ClientCreditSummary } from './types';

export function useClientCredits() {
    return useQuery({
        queryKey: ['client-credits-summary'],
        queryFn: async (): Promise<ClientCreditSummary[]> => {
            // Get all clients
            const clients = await clientApi.getAll();
            
            // Get credits for each client
            const summaries: ClientCreditSummary[] = [];
            
            for (const client of clients) {
                const credits = await clientCreditApi.getByClient(client.id);
                
                if (credits.length > 0) {
                    const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);
                    
                    // Only include clients with positive credit
                    if (totalCredit > 0.01) {
                        summaries.push({
                            clientId: client.id,
                            clientName: client.firstName,
                            clientIdentification: client.identificationNumber,
                            clientPhone: client.phone1,
                            totalCredit: totalCredit,
                            totalGenerated: totalCredit, // TODO: Track separately when credits are used
                            totalUsed: 0, // TODO: Implement credit usage tracking
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
            
            // Sort by total credit descending
            return summaries.sort((a, b) => b.totalCredit - a.totalCredit);
        },
        staleTime: 30000, // 30 seconds
    });
}

export function useClientCredit(clientId: string) {
    return useQuery({
        queryKey: ['client-credit', clientId],
        queryFn: async () => {
            const credits = await clientCreditApi.getByClient(clientId);
            const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);
            return {
                credits,
                totalCredit
            };
        },
        enabled: !!clientId,
    });
}
