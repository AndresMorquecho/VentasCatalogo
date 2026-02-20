
import type { ClientReward, RewardLevel, RewardRedemption, RewardType } from '../model/types';
import { calculateLevel, updateClientRewards as calculateUpdatedReward } from '@/shared/lib/rewards'; // assuming lib logic can be reused
import type { Order } from '@/entities/order/model/types';

// Mock Data
let MOCK_REWARDS: ClientReward[] = [
    {
        id: '1',
        clientId: '1', // Maria Fernanda Gonzalez
        totalPoints: 150,
        totalOrders: 5,
        totalSpent: 1200,
        level: 'PLATA',
        updatedAt: new Date().toISOString()
    },
    {
        id: '2',
        clientId: '2', // Ana Lucia Perez
        totalPoints: 50,
        totalOrders: 2,
        totalSpent: 400,
        level: 'BRONCE',
        updatedAt: new Date().toISOString()
    }
];

let MOCK_REDEMPTIONS: RewardRedemption[] = [];

export interface RewardApi {
    getClientReward: (clientId: string) => Promise<ClientReward>;
    redeemPoints: (clientId: string, points: number, type: RewardType) => Promise<RewardRedemption>;
    updateClientRewards: (order: Order) => Promise<ClientReward>;
    getHistory: (clientId: string) => Promise<RewardRedemption[]>;
    getAll: () => Promise<ClientReward[]>;
}

export const rewardsApi: RewardApi = {
    getClientReward: async (clientId: string) => {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_REWARDS.find(r => r.clientId === clientId) || {
            id: 'new',
            clientId,
            totalPoints: 0,
            totalOrders: 0,
            totalSpent: 0,
            level: 'BRONCE' as RewardLevel,
            updatedAt: new Date().toISOString()
        };
    },

    redeemPoints: async (clientId: string, points: number, type: RewardType) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const reward = MOCK_REWARDS.find(r => r.clientId === clientId);
        if (!reward || reward.totalPoints < points) {
            throw new Error("Puntos insuficientes o cliente no encontrado");
        }

        const newPoints = reward.totalPoints - points;
        const updatedReward: ClientReward = {
            ...reward, // Spread existing
            totalPoints: newPoints,
            level: calculateLevel(newPoints),
            updatedAt: new Date().toISOString()
        };

        const existingIndex = MOCK_REWARDS.findIndex(r => r.clientId === clientId);
        MOCK_REWARDS[existingIndex] = updatedReward;

        const newRedemption: RewardRedemption = {
            id: Math.random().toString(),
            clientId,
            pointsUsed: points,
            rewardType: type,
            createdAt: new Date().toISOString()
        };
        MOCK_REDEMPTIONS.push(newRedemption);
        return newRedemption;
    },

    updateClientRewards: async (order: Order) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const clientId = order.clientId;
        let reward = MOCK_REWARDS.find(r => r.clientId === clientId);
        if (!reward) {
            reward = {
                id: 'new',
                clientId,
                totalPoints: 0,
                totalOrders: 0,
                totalSpent: 0,
                level: 'BRONCE' as RewardLevel,
                updatedAt: new Date().toISOString()
            };
        }

        const updatedReward = calculateUpdatedReward(reward, order);
        
        const existingIndex = MOCK_REWARDS.findIndex(r => r.clientId === clientId);
        if (existingIndex >= 0) {
            MOCK_REWARDS[existingIndex] = updatedReward;
        } else {
            updatedReward.id = Math.random().toString();
            MOCK_REWARDS.push(updatedReward);
        }

        return updatedReward;
    },

    getHistory: async (clientId: string) => {
        // Mock filter
        return MOCK_REDEMPTIONS.filter(r => r.clientId === clientId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getAll: async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return [...MOCK_REWARDS];
    }
};
