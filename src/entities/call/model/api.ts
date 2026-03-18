import { httpClient } from '@/shared/lib/httpClient';
import type { Call, CallPayload } from './types';
import type { PaginatedResponse } from '@/entities/order/model/types';

export interface CallQueryParams {
    clientId?: string;
    orderId?: string;
    search?: string;
    reason?: string;
    result?: string;
    page?: number;
    limit?: number;
}

export interface CallGroup {
    date: string;
    reason: string;
    createdBy: string;
    callCount: number;
    calls: Call[];
}

export const callApi = {
    getAll: async (params?: CallQueryParams): Promise<PaginatedResponse<Call>> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) queryParams.append(key, value.toString());
            });
        }
        const url = `/calls${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return httpClient.get<PaginatedResponse<Call>>(url);
    },

    getGrouped: async (params?: CallQueryParams): Promise<CallGroup[]> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) queryParams.append(key, value.toString());
            });
        }
        const url = `/calls/grouped${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return httpClient.get<CallGroup[]>(url);
    },

    getByClient: async (clientId: string): Promise<PaginatedResponse<Call>> => {
        return httpClient.get<PaginatedResponse<Call>>(`/calls?clientId=${clientId}`);
    },

    create: async (data: CallPayload): Promise<Call> => {
        return httpClient.post<Call>('/calls', data);
    },

    update: async (id: string, data: Partial<CallPayload>): Promise<Call> => {
        return httpClient.put<Call>(`/calls/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return httpClient.delete<void>(`/calls/${id}`);
    }
};

