import { httpClient } from '@/shared/lib/httpClient';
import type { LoyaltyRule, LoyaltyRuleFormData, LoyaltyPrize, LoyaltyPrizeFormData, LoyaltyRedemption, LoyaltyBalance } from '../model/types';
import type { PaginatedResponse } from '@/entities/order/model/types';

export const loyaltyRulesApi = {
    getAll: async (): Promise<LoyaltyRule[]> => {
        const res = await httpClient.get<LoyaltyRule[]>('/loyalty/rules');
        return res || [];
    },
    create: async (data: LoyaltyRuleFormData): Promise<LoyaltyRule> => {
        const payload = {
            ...data,
            target_value: data.targetValue,
            reset_days: data.resetDays,
            is_active: data.isActive,
            prize_id: data.prizeId,
            brand_ids: data.brandIds
        };
        return httpClient.post<LoyaltyRule>('/loyalty/rules', payload);
    },
    update: async (id: string, data: Partial<LoyaltyRuleFormData>): Promise<LoyaltyRule> => {
        const payload = {
            ...data,
            target_value: data.targetValue,
            reset_days: data.resetDays,
            is_active: data.isActive,
            prize_id: data.prizeId,
            brand_ids: data.brandIds
        };
        return httpClient.put<LoyaltyRule>(`/loyalty/rules/${id}`, payload);
    },
    remove: async (id: string): Promise<void> => {
        return httpClient.delete(`/loyalty/rules/${id}`);
    }
};

export const loyaltyPrizesApi = {
    getAll: async (): Promise<LoyaltyPrize[]> => {
        const res = await httpClient.get<LoyaltyPrize[]>('/loyalty/prizes');
        return res || [];
    },
    create: async (data: LoyaltyPrizeFormData): Promise<LoyaltyPrize> => {
        const payload = {
            ...data,
            points_required: data.pointsRequired,
            is_active: data.isActive
        };
        return httpClient.post<LoyaltyPrize>('/loyalty/prizes', payload);
    },
    update: async (id: string, data: Partial<LoyaltyPrizeFormData>): Promise<LoyaltyPrize> => {
        const payload = {
            ...data,
            points_required: data.pointsRequired,
            is_active: data.isActive
        };
        return httpClient.put<LoyaltyPrize>(`/loyalty/prizes/${id}`, payload);
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
    getAll: async (params?: { page?: number; limit?: number; search?: string; brandId?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<LoyaltyRedemption>> => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.search) query.append('search', params.search);
        if (params?.brandId) query.append('brandId', params.brandId);
        if (params?.startDate) query.append('startDate', params.startDate);
        if (params?.endDate) query.append('endDate', params.endDate);
        
        return httpClient.get<PaginatedResponse<LoyaltyRedemption>>(`/loyalty/redemptions?${query.toString()}`);
    },
    redeem: async (data: { clientId: string, ruleId: string }): Promise<LoyaltyRedemption> => {
        return httpClient.post<LoyaltyRedemption>('/loyalty/redeem', { client_id: data.clientId, rule_id: data.ruleId });
    },
    getHistory: async (clientId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> => {
        const query = params ? `?page=${params.page}&limit=${params.limit}` : '';
        return httpClient.get<PaginatedResponse<any>>(`/loyalty/history/${clientId}${query}`);
    }
};

