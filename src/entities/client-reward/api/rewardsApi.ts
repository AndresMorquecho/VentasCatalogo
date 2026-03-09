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
        const res = await httpClient.get<any>(`/rewards/${clientId}`);
        return res?.data || res;
    },

    redeemPoints: async (clientId: string, points: number, type: RewardType): Promise<RewardRedemption> => {
        const res = await httpClient.post<any>(`/rewards/${clientId}/redeem`, { points, type });
        return res?.data || res;
    },

    getHistory: async (clientId: string): Promise<RewardRedemption[]> => {
        const res = await httpClient.get<any>(`/rewards/${clientId}/history`);
        return Array.isArray(res) ? res : (res?.data || []);
    },

    getAll: async (): Promise<ClientReward[]> => {
        const res = await httpClient.get<any>('/rewards');
        return Array.isArray(res) ? res : (res?.data || []);
    }
};
