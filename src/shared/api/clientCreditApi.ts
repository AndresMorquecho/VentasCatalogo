// Client Credit API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { ClientCredit } from '@/entities/client-credit/model/types';
import type { PaginatedResponse } from '@/entities/order/model/types';


export const clientCreditApi = {
  /**
   * Get credits by client
   * @endpoint GET /api/client-credits?clientId=:clientId
   */
  getByClient: async (clientId: string, page?: number, limit?: number): Promise<PaginatedResponse<ClientCredit>> => {
    const params = new URLSearchParams();
    params.append('clientId', clientId);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return httpClient.get<PaginatedResponse<ClientCredit>>(`/client-credits?${params.toString()}`);
  },

  /**
   * Get summary of credits for all clients
   * @endpoint GET /api/client-credits/summary
   */
  getSummary: async (page?: number, limit?: number, search?: string): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    const url = `/client-credits/summary${params.toString() ? `?${params.toString()}` : ''}`;
    return httpClient.get<PaginatedResponse<any>>(url);
  },


  /**
   * Get available credits by client
   * @endpoint GET /api/client-credits?clientId=:clientId&status=AVAILABLE
   */
  getAvailableByClient: async (clientId: string): Promise<ClientCredit[]> => {
    const res = await httpClient.get<any>(`/client-credits?clientId=${clientId}&status=AVAILABLE`);
    return Array.isArray(res) ? res : (res?.data || []);
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
