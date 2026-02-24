import { httpClient } from '@/shared/lib/httpClient';
import type { LoyaltyRule, LoyaltyRuleFormData, LoyaltyPrize, LoyaltyPrizeFormData, LoyaltyRedemption } from '../model/types';

export const loyaltyRulesApi = {
    getAll: async (): Promise<LoyaltyRule[]> => {
        return httpClient.get<LoyaltyRule[]>('/loyalty/rules');
    },
    create: async (data: LoyaltyRuleFormData): Promise<LoyaltyRule> => {
        return httpClient.post<LoyaltyRule>('/loyalty/rules', data);
    },
    update: async (id: string, data: Partial<LoyaltyRuleFormData>): Promise<LoyaltyRule> => {
        return httpClient.put<LoyaltyRule>(`/loyalty/rules/${id}`, data);
    },
    delete: async (id: string): Promise<void> => {
        return httpClient.delete(`/loyalty/rules/${id}`);
    }
};

export const loyaltyPrizesApi = {
    getAll: async (): Promise<LoyaltyPrize[]> => {
        return httpClient.get<LoyaltyPrize[]>('/loyalty/prizes');
    },
    create: async (data: LoyaltyPrizeFormData): Promise<LoyaltyPrize> => {
        return httpClient.post<LoyaltyPrize>('/loyalty/prizes', data);
    },
    update: async (id: string, data: Partial<LoyaltyPrizeFormData>): Promise<LoyaltyPrize> => {
        return httpClient.put<LoyaltyPrize>(`/loyalty/prizes/${id}`, data);
    },
    delete: async (id: string): Promise<void> => {
        return httpClient.delete(`/loyalty/prizes/${id}`);
    }
};

export const loyaltyRedemptionsApi = {
    getAll: async (): Promise<LoyaltyRedemption[]> => {
        return httpClient.get<LoyaltyRedemption[]>('/rewards/history/all');
    }
};
