import { httpClient } from '@/shared/lib/httpClient';
import type { PaginatedResponse } from '@/entities/order/model/types';
import type { User, UserPayload } from './types';

export const userApi = {
  getAll: async (params?: { search?: string; limit?: number; page?: number }): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return httpClient.get<PaginatedResponse<User>>(url);
  },

  getById: async (id: string): Promise<User> => {
    return httpClient.get<User>(`/users/${id}`);
  },

  create: async (payload: UserPayload): Promise<User> => {
    return httpClient.post<User>('/users', payload);
  },

  update: async (id: string, payload: Partial<UserPayload>): Promise<User> => {
    return httpClient.put<User>(`/users/${id}`, payload);
  },
};
