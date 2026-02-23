import { httpClient } from '@/shared/lib/httpClient';
import type { Call, CallPayload } from './types';

export const callApi = {
    getAll: async (clientId?: string): Promise<Call[]> => {
        const url = clientId ? `/calls?clientId=${clientId}` : '/calls';
        return httpClient.get<Call[]>(url);
    },

    getByClient: async (clientId: string): Promise<Call[]> => {
        return httpClient.get<Call[]>(`/calls?clientId=${clientId}`);
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
