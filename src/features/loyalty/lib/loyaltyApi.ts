import { httpClient } from '@/shared/lib/httpClient';
import type { LoyaltyRule, LoyaltyRuleFormData, LoyaltyPrize, LoyaltyPrizeFormData, LoyaltyRedemption } from '../model/types';
import type { PaginatedResponse } from '@/entities/order/model/types';

export const loyaltyRulesApi = {
    getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<LoyaltyRule>> => {
        const query = params ? `?page=${params.page}&limit=${params.limit}` : '';
        return httpClient.get<PaginatedResponse<LoyaltyRule>>(`/loyalty/rules${query}`);
    },
    create: async (data: LoyaltyRuleFormData): Promise<LoyaltyRule> => {
        return httpClient.post<LoyaltyRule>('/loyalty/rules', data);
    },
    update: async (id: string, data: Partial<LoyaltyRuleFormData>): Promise<LoyaltyRule> => {
        return httpClient.put<LoyaltyRule>(`/loyalty/rules/${id}`, data);
    },
    remove: async (id: string): Promise<void> => {
        return httpClient.delete(`/loyalty/rules/${id}`);
    },
    toggle: async (id: string): Promise<LoyaltyRule> => {
        return httpClient.post<LoyaltyRule>(`/loyalty/rules/${id}/toggle`, {});
    }
};

export const loyaltyPrizesApi = {
    getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<LoyaltyPrize>> => {
        const query = params ? `?page=${params.page}&limit=${params.limit}` : '';
        return httpClient.get<PaginatedResponse<LoyaltyPrize>>(`/loyalty/prizes${query}`);
    },
    create: async (data: LoyaltyPrizeFormData): Promise<LoyaltyPrize> => {
        return httpClient.post<LoyaltyPrize>('/loyalty/prizes', data);
    },
    update: async (id: string, data: Partial<LoyaltyPrizeFormData>): Promise<LoyaltyPrize> => {
        return httpClient.put<LoyaltyPrize>(`/loyalty/prizes/${id}`, data);
    },
    remove: async (id: string): Promise<void> => {
        return httpClient.delete(`/loyalty/prizes/${id}`);
    },
    toggle: async (id: string): Promise<LoyaltyPrize> => {
        return httpClient.post<LoyaltyPrize>(`/loyalty/prizes/${id}/toggle`, {});
    }
};

export const loyaltyRedemptionsApi = {
    getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<LoyaltyRedemption>> => {
        const query = params ? `?page=${params.page}&limit=${params.limit}` : '';
        return httpClient.get<PaginatedResponse<LoyaltyRedemption>>(`/loyalty/redemptions${query}`);
    },
    redeem: async (data: { clientId: string, prizeId: string }): Promise<LoyaltyRedemption> => {
        return httpClient.post<LoyaltyRedemption>('/loyalty/redeem', data);
    },
    getHistory: async (clientId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> => {
        const query = params ? `?page=${params.page}&limit=${params.limit}` : '';
        return httpClient.get<PaginatedResponse<any>>(`/loyalty/history/${clientId}${query}`);
    }
};

