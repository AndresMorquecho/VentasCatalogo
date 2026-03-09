import type { Client, ClientPayload } from '@/entities/client/model/types';
import { httpClient } from '../lib/httpClient';
import type { PaginatedResponse } from '@/entities/order/model/types';

export const clientApi = {
    getAll: async (params?: { page?: number; limit?: number; search?: string; active?: boolean }): Promise<PaginatedResponse<Client>> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.active !== undefined) queryParams.append('active', params.active.toString());

        return httpClient.get<PaginatedResponse<Client>>(`/clients?${queryParams.toString()}`);
    },

    getById: async (id: string): Promise<Client | undefined> => {
        try {
            return await httpClient.get<Client>(`/clients/${id}`);
        } catch {
            return undefined;
        }
    },

    create: async (payload: ClientPayload): Promise<Client> => {
        return httpClient.post<Client>('/clients', payload);
    },

    update: async (id: string, payload: Partial<ClientPayload>): Promise<Client> => {
        return httpClient.put<Client>(`/clients/${id}`, payload);
    },

    delete: async (id: string): Promise<void> => {
        await httpClient.delete<void>(`/clients/${id}`);
    },
};
