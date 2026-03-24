import { httpClient } from '@/shared/lib/httpClient';
import type { PaginatedResponse } from '@/entities/order/model/types';
import type { BankAccount } from './types';

export const bankAccountApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<BankAccount>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const url = `/bank-accounts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return httpClient.get<PaginatedResponse<BankAccount>>(url);
  },

  getById: async (id: string): Promise<BankAccount> => {
    return httpClient.get<BankAccount>(`/bank-accounts/${id}`);
  },
};
