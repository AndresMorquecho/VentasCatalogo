
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsApi } from '@/entities/client-reward/api/rewardsApi';
import type { ClientReward, RewardType } from '@/entities/client-reward/model/types';

export const useRewards = () => {
    const qc = useQueryClient();

    const { data: rewards = [] } = useQuery({
        queryKey: ['client-rewards'],
        queryFn: rewardsApi.getAll,
    });

    const getClientReward = (clientId: string): ClientReward => {
        return rewards.find(r => r.clientId === clientId) || {
            id: 'new',
            clientId,
            totalPoints: 0,
            totalOrders: 0,
            totalSpent: 0,
            level: 'BRONCE',
            updatedAt: new Date().toISOString()
        };
    };



    const { mutateAsync: redeemPoints } = useMutation({
        mutationFn: async ({ clientId, points, type }: { clientId: string, points: number, type: RewardType, cost: number }) => { // cost is redundant if points used passed
             return await rewardsApi.redeemPoints(clientId, points, type);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['client-rewards'] });
        }
    });



    return {
        rewards,
        getClientReward,
        redeemPoints: (clientId: string, points: number, type: RewardType) => redeemPoints({ clientId, points, type, cost: points }),
    };
};
