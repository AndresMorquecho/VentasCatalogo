import { httpClient } from '@/shared/lib/httpClient';

export interface LoyaltyRule {
    id: string;
    name: string;
    description: string | null;
    type: 'POR_MONTO' | 'POR_PEDIDOS';
    targetValue: number;
    resetDays: number | null;
    isActive: boolean;
    prizeId: string | null;
    brands: { brandId: string; brand: { name: string } }[];
}

export interface LoyaltyBalance {
    id: string;
    name: string;
    idNumber: string;
    rules: {
        ruleId: string;
        ruleName: string;
        prizeName: string | null;
        type: 'POR_MONTO' | 'POR_PEDIDOS';
        progress: number;
        current: number;
        target: number;
        missing: number;
        expiringDays: number | null;
        canRedeem: boolean;
    }[];
}

export const rewardsApi = {
    getBalances: async (params?: { page?: number; limit?: number; search?: string }) => {
        let url = '/loyalty/balances';
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.search) query.append('search', params.search);
        
        const queryString = query.toString();
        if (queryString) url += `?${queryString}`;
        
        const res = await httpClient.get<any>(url);
        return res;
    },

    getRules: async () => {
        const res = await httpClient.get<any>('/loyalty/rules');
        return res.data || [];
    },

    saveRule: async (data: any) => {
        if (data.id) {
            return await httpClient.put<any>(`/loyalty/rules/${data.id}`, data);
        }
        return await httpClient.post<any>('/loyalty/rules', data);
    },

    deleteRule: async (id: string) => {
        return await httpClient.delete<any>(`/loyalty/rules/${id}`);
    },

    redeem: async (clientId: string, ruleId: string) => {
        return await httpClient.post<any>('/loyalty/redeem', { clientId, ruleId });
    },

    getPrizes: async () => {
        const res = await httpClient.get<any>('/loyalty/prizes');
        return res.data || [];
    },

    savePrize: async (data: any) => {
        if (data.id) {
            return await httpClient.put<any>(`/loyalty/prizes/${data.id}`, data);
        }
        return await httpClient.post<any>('/loyalty/prizes', data);
    },

    deletePrize: async (id: string) => {
        return await httpClient.delete<any>(`/loyalty/prizes/${id}`);
    }
};
