import type { Client, ClientPayload } from '@/entities/client/model/types';
import { httpClient } from '../lib/httpClient';

export const clientApi = {
    getAll: async (): Promise<Client[]> => {
        return httpClient.get<Client[]>('/clients');
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
