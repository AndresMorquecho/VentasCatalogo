import { httpClient } from '../lib/httpClient';

export interface PaymentPayload {
    orderId: string;
    amount: number;
    method: string;
    referenceNumber?: string;
    bankAccountId: string;
    notes?: string;
    clientId?: string;
    creditAmount?: number;
}

export interface MultiplePaymentPayload {
    orderId: string;
    payments: Array<{
        amount: number;
        method: string;
        transactionReference?: string;
        bankAccountId?: string;
        notes?: string;
    }>;
}

export interface SplitPaymentPayload {
    orders: Array<{ orderId: string; amount: number }>;
    payments: Array<{
        method: string;
        amount: number;
        bankAccountId?: string;
        transactionReference?: string;
        notes?: string;
    }>;
    total: number;
    requestId: string;
}

/**
 * Payment API - Transport Layer
 * 
 * Directly communicates with the hexagonal backend /payments endpoint.
 */
export const paymentApi = {
    registerPayment: async (payload: PaymentPayload): Promise<any> => {
        return httpClient.post<any>('/payments', payload);
    },

    registerMultiplePayments: async (payload: MultiplePaymentPayload): Promise<any> => {
        return httpClient.post<any>('/payments', payload);
    },

    getHistory: async (orderId: string): Promise<any[]> => {
        // We can get history from the order entity itself or dedicated endpoint
        // For now, let's assume it's part of the order data
        return httpClient.get<any[]>(`/orders/${orderId}/payments`);
    },

    revertPayment: async (_orderId: string, paymentId: string): Promise<void> => {
        // The backend expects DELETE /payments/:paymentId
        return httpClient.delete<void>(`/payments/${paymentId}`);
    },

    processSplitPayment: async (payload: SplitPaymentPayload): Promise<any> => {
        return httpClient.post<any>('/payments/split', payload);
    }
};
