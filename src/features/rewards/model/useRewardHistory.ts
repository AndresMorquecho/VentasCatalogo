
import { useQuery } from '@tanstack/react-query';
import { rewardsApi } from '@/entities/client-reward/api/rewardsApi';

export const useRewardHistory = (clientId: string) => {
    return useQuery({
        queryKey: ['client-reward-history', clientId],
        queryFn: () => rewardsApi.getHistory(clientId),
        enabled: !!clientId
    });
};
