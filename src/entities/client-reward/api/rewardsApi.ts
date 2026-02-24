import { httpClient } from '@/shared/lib/httpClient';
import type { ClientReward, RewardRedemption, RewardType } from '../model/types';

export interface RewardApi {
    getClientReward: (clientId: string) => Promise<ClientReward>;
    redeemPoints: (clientId: string, points: number, type: RewardType) => Promise<RewardRedemption>;
    getHistory: (clientId: string) => Promise<RewardRedemption[]>;
    getAll: () => Promise<ClientReward[]>;
}

export const rewardsApi: RewardApi = {
    getClientReward: async (clientId: string): Promise<ClientReward> => {
        return httpClient.get<ClientReward>(`/rewards/${clientId}`);
    },

    redeemPoints: async (clientId: string, points: number, type: RewardType): Promise<RewardRedemption> => {
        return httpClient.post<RewardRedemption>(`/rewards/${clientId}/redeem`, { points, type });
    },

    getHistory: async (clientId: string): Promise<RewardRedemption[]> => {
        return httpClient.get<RewardRedemption[]>(`/rewards/${clientId}/history`);
    },

    getAll: async (): Promise<ClientReward[]> => {
        return httpClient.get<ClientReward[]>('/rewards');
    }
};
