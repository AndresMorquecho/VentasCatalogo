import { httpClient } from '../../../shared/lib/httpClient';
import type {
  Exchange,
  ExchangeItem,
  ExchangeBatch,
  CreateExchangeDTO,
  AddItemDTO,
  ProcessFinancialDTO,
  ProcessResult,
  ExchangeFilters,
  CreateExchangeBatchDTO,
} from '../model/types';

function toQueryString(filters?: ExchangeFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.onlyExchanges) params.set('onlyExchanges', 'true');
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const exchangesApi = {
  create: (dto: CreateExchangeDTO) =>
    httpClient.post<Exchange>('/exchanges', dto),

  list: (filters?: ExchangeFilters) =>
    httpClient.get<Exchange[]>(`/exchanges${toQueryString(filters)}`),

  getById: (id: string) =>
    httpClient.get<Exchange>(`/exchanges/${id}`),

  updateStatus: (id: string, newStatus: string) =>
    httpClient.patch<Exchange>(`/exchanges/${id}/status`, { newStatus }),

  addItem: (exchangeId: string, dto: AddItemDTO) =>
    httpClient.post<ExchangeItem>(`/exchanges/${exchangeId}/items`, dto),

  updateItem: (exchangeId: string, itemId: string, newValue: number) =>
    httpClient.put<ExchangeItem>(`/exchanges/${exchangeId}/items/${itemId}`, { newValue }),

  processFinancial: (exchangeId: string, dto: ProcessFinancialDTO) =>
    httpClient.post<ProcessResult>(`/exchanges/${exchangeId}/process-financial`, dto),

  listBatches: (filters?: { status?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    const qs = params.toString();
    return httpClient.get<ExchangeBatch[]>(`/exchanges/batches${qs ? `?${qs}` : ''}`);
  },

  createBatch: (dto: CreateExchangeBatchDTO) =>
    httpClient.post<ExchangeBatch>('/exchanges/batches', dto),

  updateBatchStatus: (id: string, newStatus: string) =>
    httpClient.patch<ExchangeBatch>(`/exchanges/batches/${id}/status`, { newStatus }),
};
