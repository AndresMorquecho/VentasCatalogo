import { httpClient } from '@/shared/lib/httpClient';
import type { PaginatedResponse } from '@/entities/order/model/types';
import type {
  FinancialRecord,
  CreateFinancialRecordPayload,
  UpdateFinancialRecordPayload
} from './types';

export const financialRecordApi = {
  /**
   * Get all financial records with pagination and filters
   */
  getAll: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; clientId?: string }): Promise<PaginatedResponse<FinancialRecord>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const url = `/financial-records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return httpClient.get<PaginatedResponse<FinancialRecord>>(url);
  },

  /**
   * Get financial record by ID
   */
  getById: async (id: string): Promise<FinancialRecord> => {
    return httpClient.get<FinancialRecord>(`/financial-records/${id}`);
  },

  /**
   * Get financial records by client
   */
  getByClient: async (clientId: string): Promise<FinancialRecord[]> => {
    const res = await httpClient.get<any>(`/financial-records?clientId=${clientId}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Get financial records by order
   */
  getByOrder: async (orderId: string): Promise<FinancialRecord[]> => {
    const res = await httpClient.get<any>(`/financial-records?orderId=${orderId}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Get financial records by date range
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<FinancialRecord[]> => {
    const res = await httpClient.get<any>(
      `/financial-records?startDate=${startDate}&endDate=${endDate}`
    );
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Create financial record
   */
  create: async (payload: CreateFinancialRecordPayload): Promise<FinancialRecord> => {
    return httpClient.post<FinancialRecord>('/financial-records', payload);
  },

  /**
   * Update financial record
   */
  update: async (id: string, payload: UpdateFinancialRecordPayload): Promise<FinancialRecord> => {
    return httpClient.put<FinancialRecord>(`/financial-records/${id}`, payload);
  },

  /**
   * Delete financial record (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/financial-records/${id}`);
  }
};
