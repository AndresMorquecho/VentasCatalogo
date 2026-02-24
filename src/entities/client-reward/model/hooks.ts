import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsApi } from '../api/rewardsApi';
import type { RewardType } from './types';

export function useRewards() {
    const queryClient = useQueryClient();

    const { data: rewards = [], isLoading } = useQuery({
        queryKey: ['rewards'],
        queryFn: () => rewardsApi.getAll()
    });

    const redeemPoints = useMutation({
        mutationFn: ({ clientId, points, type }: { clientId: string; points: number; type: RewardType }) =>
            rewardsApi.redeemPoints(clientId, points, type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
        }
    });

    const getClientReward = (clientId: string) => {
        return rewards.find(r => r.clientId === clientId) || {
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
