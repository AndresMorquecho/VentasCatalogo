import { httpClient } from '../../../shared/lib/httpClient';
import type {
  Exchange,
  ExchangeItem,
  CreateExchangeDTO,
  AddItemDTO,
  ProcessFinancialDTO,
  ProcessResult,
  ExchangeFilters,
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
    httpClient.post<Exchange>('/api/exchanges', dto),

  list: (filters?: ExchangeFilters) =>
    httpClient.get<Exchange[]>(`/api/exchanges${toQueryString(filters)}`),

  getById: (id: string) =>
    httpClient.get<Exchange>(`/api/exchanges/${id}`),

  updateStatus: (id: string, newStatus: string) =>
    httpClient.patch<Exchange>(`/api/exchanges/${id}/status`, { newStatus }),

  addItem: (exchangeId: string, dto: AddItemDTO) =>
    httpClient.post<ExchangeItem>(`/api/exchanges/${exchangeId}/items`, dto),

  updateItem: (exchangeId: string, itemId: string, newValue: number) =>
    httpClient.put<ExchangeItem>(`/api/exchanges/${exchangeId}/items/${itemId}`, { newValue }),

  processFinancial: (exchangeId: string, dto: ProcessFinancialDTO) =>
    httpClient.post<ProcessResult>(`/api/exchanges/${exchangeId}/process-financial`, dto),
};
