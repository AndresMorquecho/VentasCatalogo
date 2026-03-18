import { httpClient } from "@/shared/lib/httpClient";

export interface WalletRechargePayload {
    client_id: string;
    amount: number;
    payment_method: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO';
    bank_account_id?: string;
    reference?: string;
    notes?: string;
}

export const walletApi = {
    recharge: async (payload: WalletRechargePayload) => {
        return httpClient.post('/wallet/recharges', payload);
    },
    
    getRecharges: async (params?: { 
        status?: string; 
        client_id?: string; 
        search?: string;
        page?: number; 
        limit?: number;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.client_id) queryParams.append('client_id', params.client_id);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const queryString = queryParams.toString();
        
        // Match backend routes: /recharges/pending or /recharges/history
        const endpoint = params?.status === 'PENDIENTE_VALIDACION' 
            ? '/wallet/recharges/pending' 
            : '/wallet/recharges/history';

        const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        return httpClient.get<any>(url);
    },
    
    validateRecharges: async (ids: string[]) => {
        // Match backend route: /recharges/validate
        return httpClient.post('/wallet/recharges/validate', { rechargeIds: ids });
    },

    rejectRecharge: async (id: string, reason: string) => {
        // Match backend route: /recharge/:id/reject
        return httpClient.post(`/wallet/recharge/${id}/reject`, { reason });
    },

    getClientWalletHistory: async (clientId: string): Promise<WalletHistoryResponse> => {
        // Match backend route: /client/:clientId/history
        return httpClient.get(`/wallet/client/${clientId}/history`);
    }
};

export interface WalletHistoryItem {
    id: string;
    type: string;
    movementType: string;
    amount: number;
    date: string;
    createdBy: string;
    notes: string | null;
    orderId: string | null;
    orderReceiptNumber: string | null;
    orderNumber: string | null;
    brandName: string | null;
    balance: number;
}

export interface WalletHistoryResponse {
    history: WalletHistoryItem[];
    currentBalance: number;
}
