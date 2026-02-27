// Bank Account API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { BankAccount, BankAccountPayload } from '@/entities/bank-account/model/types';

export const bankAccountApi = {
  /**
   * Get all bank accounts
   * @endpoint GET /api/bank-accounts
   */
  getAll: async (): Promise<BankAccount[]> => {
    return httpClient.get<BankAccount[]>('/bank-accounts');
  },

  /**
   * Get bank account by ID
   * @endpoint GET /api/bank-accounts/:id
   */
  getById: async (id: string): Promise<BankAccount> => {
    return httpClient.get<BankAccount>(`/bank-accounts/${id}`);
  },

  /**
   * Create new bank account
   * @endpoint POST /api/bank-accounts
   */
  create: async (payload: BankAccountPayload): Promise<BankAccount> => {
    return httpClient.post<BankAccount>('/bank-accounts', payload);
  },

  /**
   * Update bank account
   * @endpoint PUT /api/bank-accounts/:id
   */
  update: async (id: string, payload: Partial<BankAccountPayload>): Promise<BankAccount> => {
    return httpClient.put<BankAccount>(`/bank-accounts/${id}`, payload);
  },

  /**
   * Toggle bank account status (activate/deactivate)
   * @endpoint PUT /api/bank-accounts/:id/toggle-status
   */
  toggleStatus: async (id: string): Promise<BankAccount> => {
    return httpClient.put<BankAccount>(`/bank-accounts/${id}/toggle-status`, {});
  },

  /**
   * Delete bank account (soft delete)
   * @endpoint DELETE /api/bank-accounts/:id
   */
  delete: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/bank-accounts/${id}`);
  }
};
