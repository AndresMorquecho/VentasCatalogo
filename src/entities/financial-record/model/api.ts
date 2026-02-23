// Financial Record API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { 
  FinancialRecord, 
  CreateFinancialRecordPayload,
  UpdateFinancialRecordPayload 
} from './types';

export const financialRecordApi = {
  /**
   * Get all financial records
   */
  getAll: async (): Promise<FinancialRecord[]> => {
    return httpClient.get<FinancialRecord[]>('/financial-records');
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
    return httpClient.get<FinancialRecord[]>(`/financial-records?clientId=${clientId}`);
  },

  /**
   * Get financial records by order
   */
  getByOrder: async (orderId: string): Promise<FinancialRecord[]> => {
    return httpClient.get<FinancialRecord[]>(`/financial-records?orderId=${orderId}`);
  },

  /**
   * Get financial records by date range
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<FinancialRecord[]> => {
    return httpClient.get<FinancialRecord[]>(
      `/financial-records?startDate=${startDate}&endDate=${endDate}`
    );
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
