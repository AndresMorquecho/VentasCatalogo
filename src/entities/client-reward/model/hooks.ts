import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsApi } from '../api/rewardsApi';

export function useRewards() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['rewards'],
        queryFn: () => rewardsApi.getBalances()
    });
    const rewards = data?.data || [];

    const redeemPoints = useMutation({
        mutationFn: ({ clientId, ruleId }: { clientId: string; ruleId: string }) =>
            rewardsApi.redeem(clientId, ruleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
        }
    });

    const getClientReward = (clientId: string) => {
        return rewards.find((r: any) => r.clientId === clientId) || {
            id: 'temp',
            clientId,
            totalRewardPoints: 0,
            totalOrders: 0,
            totalSpent: 0,
            rewardLevel: 'BRONCE' as const,
            updatedAt: new Date().toISOString()
        };
    };

    return {
        rewards,
        isLoading,
        getClientReward,
        redeemPoints: redeemPoints.mutateAsync,
        isRedeeming: redeemPoints.isPending
    };
}
