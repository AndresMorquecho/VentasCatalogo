import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangesApi } from '../lib/exchangesApi';
import type { CreateExchangeDTO, AddItemDTO, ProcessFinancialDTO, ExchangeFilters, ReceiveBatchDTO } from './types';

export function useExchanges(filters?: ExchangeFilters) {
  return useQuery({
    queryKey: ['exchanges', filters],
    queryFn: () => exchangesApi.list(filters),
    select: (res) => res || [],
  });
}

export function useExchangeBatches(filters?: { status?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['exchange-batches', filters],
    queryFn: () => exchangesApi.listBatches(filters),
    select: (res) => res || [],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateExchangeBatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      exchangesApi.updateBatchStatus(id, newStatus),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchange-batches'] }),
  });
}

export function useExchangeDetail(id: string) {
  return useQuery({
    queryKey: ['exchanges', id],
    queryFn: () => exchangesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExchangeDTO) => exchangesApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchanges'] }),
  });
}

export function useUpdateExchangeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      exchangesApi.updateStatus(id, newStatus),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchanges'] }),
  });
}

export function useAddExchangeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ exchangeId, dto }: { exchangeId: string; dto: AddItemDTO }) =>
      exchangesApi.addItem(exchangeId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchanges'] }),
  });
}

export function useUpdateExchangeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      exchangeId,
      itemId,
      newValue,
    }: {
      exchangeId: string;
      itemId: string;
      newValue: number;
    }) => exchangesApi.updateItem(exchangeId, itemId, newValue),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchanges'] }),
  });
}

export function useProcessExchangeFinancial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ exchangeId, dto }: { exchangeId: string; dto: ProcessFinancialDTO }) =>
      exchangesApi.processFinancial(exchangeId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchanges'] }),
  });
}

export function useReceiveExchangeBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, dto }: { batchId: string; dto: ReceiveBatchDTO }) =>
      exchangesApi.receiveBatch(batchId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchange-batches'] }),
  });
}
