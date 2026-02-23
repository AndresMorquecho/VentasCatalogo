// Cash Closure API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { CashClosure, CreateCashClosurePayload } from '@/entities/cash-closure/model/types';

export const cashClosureApi = {
  /**
   * Get all cash closures
   * @endpoint GET /api/cash-closures
   */
  getAll: async (): Promise<CashClosure[]> => {
    return httpClient.get<CashClosure[]>('/cash-closures');
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
   * Get cash closures by date range
   * @endpoint GET /api/cash-closures?startDate=:startDate&endDate=:endDate
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<CashClosure[]> => {
    return httpClient.get<CashClosure[]>(
      `/cash-closures?startDate=${startDate}&endDate=${endDate}`
    );
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
