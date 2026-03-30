import { httpClient } from '@/shared/lib/httpClient';
import type { PaginatedResponse } from '@/entities/order/model/types';
import type {
  FinancialRecord,
  CreateFinancialRecordPayload,
  UpdateFinancialRecordPayload
} from './types';
import type { TransactionCardDTO } from './transactionCard.types';

export interface TransactionCardsParams {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}

export interface TransactionCardsResponse {
  data: TransactionCardDTO[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalCards: number;
    pages: number;
  };
}

export const financialRecordApi = {
  /**
   * Get all financial records as TransactionCardDTO[]
   * This is the PREFERRED endpoint — frontend renders only, no logic.
   */
  getCards: async (params?: TransactionCardsParams): Promise<TransactionCardsResponse> => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.append(k, String(v)); });
    return httpClient.get<TransactionCardsResponse>(`/financial-records/cards${q.toString() ? `?${q}` : ''}`);
  },

  /**
   * Get all financial records with pagination and filters
   */
  getAll: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; clientId?: string; referenceNumber?: string; accountType?: string; bankAccountId?: string; createdBy?: string }): Promise<PaginatedResponse<FinancialRecord>> => {
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
