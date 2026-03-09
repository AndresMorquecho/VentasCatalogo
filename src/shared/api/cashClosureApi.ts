// Cash Closure API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { CashClosure, CreateCashClosurePayload } from '@/entities/cash-closure/model/types';
import type { PaginatedResponse } from '@/entities/order/model/types';

export const cashClosureApi = {
  /**
   * Get all cash closures
   * @endpoint GET /api/cash-closures
   */
  getAll: async (page?: number, limit?: number): Promise<PaginatedResponse<CashClosure>> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const url = `/cash-closures${params.toString() ? `?${params.toString()}` : ''}`;
    return httpClient.get<PaginatedResponse<CashClosure>>(url);
  },


  /**
   * Get cash closure by ID
   * @endpoint GET /api/cash-closures/:id
   */
  getById: async (id: string): Promise<CashClosure> => {
    return httpClient.get<CashClosure>(`/cash-closures/${id}`);
  },

  /**
   * Get cash closures by date
   * @endpoint GET /api/cash-closures?date=:date
   */
  getByDate: async (date: string): Promise<CashClosure[]> => {
    return httpClient.get<CashClosure[]>(`/cash-closures?date=${date}`);
  },

  /**
   * Get cash closure preview
   * @endpoint GET /api/cash-closures/preview?toDate=:toDate
   */
  getPreview: async (toDate?: string): Promise<any> => {
    return httpClient.get<any>(`/cash-closures/preview${toDate ? `?toDate=${toDate}` : ''}`);
  },

  /**
   * Create cash closure
   * @endpoint POST /api/cash-closures
   */
  create: async (payload: CreateCashClosurePayload): Promise<CashClosure> => {
    return httpClient.post<CashClosure>('/cash-closures', payload);
  },

  /**
   * Update cash closure
   * @endpoint PUT /api/cash-closures/:id
   */
  update: async (id: string, payload: Partial<CreateCashClosurePayload>): Promise<CashClosure> => {
    return httpClient.put<CashClosure>(`/cash-closures/${id}`, payload);
  },

  /**
   * Delete cash closure
   * @endpoint DELETE /api/cash-closures/:id
   */
  delete: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/cash-closures/${id}`);
  }
};
