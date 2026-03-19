import { httpClient } from '@/shared/lib/httpClient';
import type { LoyaltyRule, LoyaltyRuleFormData, LoyaltyPrize, LoyaltyPrizeFormData, LoyaltyRedemption, LoyaltyBalance } from '../model/types';
import type { PaginatedResponse } from '@/entities/order/model/types';

export const loyaltyRulesApi = {
    getAll: async (): Promise<LoyaltyRule[]> => {
        const res = await httpClient.get<any>('/loyalty/rules');
        return res?.data || [];
    },
    create: async (data: LoyaltyRuleFormData): Promise<LoyaltyRule> => {
        return httpClient.post<LoyaltyRule>('/loyalty/rules', data);
    },
    update: async (id: string, data: Partial<LoyaltyRuleFormData>): Promise<LoyaltyRule> => {
        return httpClient.put<LoyaltyRule>(`/loyalty/rules/${id}`, data);
    },
    remove: async (id: string): Promise<void> => {
        return httpClient.delete(`/loyalty/rules/${id}`);
    }
};

export const loyaltyPrizesApi = {
    getAll: async (): Promise<LoyaltyPrize[]> => {
        const res = await httpClient.get<any>('/loyalty/prizes');
        return res?.data || [];
    },
    create: async (data: LoyaltyPrizeFormData): Promise<LoyaltyPrize> => {
        return httpClient.post<LoyaltyPrize>('/loyalty/prizes', data);
    },
    update: async (id: string, data: Partial<LoyaltyPrizeFormData>): Promise<LoyaltyPrize> => {
        return httpClient.put<LoyaltyPrize>(`/loyalty/prizes/${id}`, data);
    },
    remove: async (id: string): Promise<void> => {
        return httpClient.delete(`/loyalty/prizes/${id}`);
    }
};

export const loyaltyBalancesApi = {
    getAll: async (params?: { page?: number; limit?: number, search?: string }): Promise<PaginatedResponse<LoyaltyBalance>> => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.search) query.append('search', params.search);
        return httpClient.get<PaginatedResponse<LoyaltyBalance>>(`/loyalty/balances?${query.toString()}`);
    }
};

export const loyaltyRedemptionsApi = {
    getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<LoyaltyRedemption>> => {
        const query = params ? `?page=${params.page}&limit=${params.limit}` : '';
        return httpClient.get<PaginatedResponse<LoyaltyRedemption>>(`/loyalty/redemptions${query}`);
    },
    redeem: async (data: { clientId: string, ruleId: string }): Promise<LoyaltyRedemption> => {
        return httpClient.post<LoyaltyRedemption>('/loyalty/redeem', data);
    },
    getHistory: async (clientId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> => {
        const query = params ? `?page=${params.page}&limit=${params.limit}` : '';
        return httpClient.get<PaginatedResponse<any>>(`/loyalty/history/${clientId}${query}`);
    }
};

