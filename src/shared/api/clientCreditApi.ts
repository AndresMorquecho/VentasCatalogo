// Client Credit API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { ClientCredit } from '@/entities/client-credit/model/types';

export const clientCreditApi = {
  /**
   * Get credits by client
   * @endpoint GET /api/client-credits?clientId=:clientId
   */
  getByClient: async (clientId: string): Promise<ClientCredit[]> => {
    return httpClient.get<ClientCredit[]>(`/client-credits?clientId=${clientId}`);
  },

  /**
   * Get available credits by client
   * @endpoint GET /api/client-credits?clientId=:clientId&status=AVAILABLE
   */
  getAvailableByClient: async (clientId: string): Promise<ClientCredit[]> => {
    return httpClient.get<ClientCredit[]>(`/client-credits?clientId=${clientId}&status=AVAILABLE`);
  },

  /**
   * Get credit by ID
   * @endpoint GET /api/client-credits/:id
   */
  getById: async (id: string): Promise<ClientCredit> => {
    return httpClient.get<ClientCredit>(`/client-credits/${id}`);
  },

  /**
   * Create credit
   * @endpoint POST /api/client-credits
   */
  createCredit: async (data: Omit<ClientCredit, 'id' | 'createdAt'>): Promise<ClientCredit> => {
    return httpClient.post<ClientCredit>('/client-credits', data);
  },

  /**
   * Use credit (reduce amount)
   * @endpoint POST /api/client-credits/:id/use
   */
  useCredit: async (creditId: string, amountToUse: number): Promise<ClientCredit> => {
    return httpClient.post<ClientCredit>(`/client-credits/${creditId}/use`, { amountToUse });
  },

  /**
   * Delete credit
   * @endpoint DELETE /api/client-credits/:id
   */
  delete: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/client-credits/${id}`);
  }
};
