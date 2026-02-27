// Financial Record React Query Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialRecordApi } from './api';
import type { CreateFinancialRecordPayload, UpdateFinancialRecordPayload } from './types';

// Query Keys
export const financialRecordKeys = {
  all: ['financial-records'] as const,
  detail: (id: string) => ['financial-records', id] as const,
  byClient: (clientId: string) => ['financial-records', 'client', clientId] as const,
  byOrder: (orderId: string) => ['financial-records', 'order', orderId] as const,
  byDateRange: (startDate: string, endDate: string) => 
    ['financial-records', 'date-range', startDate, endDate] as const
};

/**
 * Get all financial records
 */
export const useFinancialRecords = () => {
  return useQuery({
    queryKey: financialRecordKeys.all,
    queryFn: financialRecordApi.getAll
  });
};

/**
 * Get financial record by ID
 */
export const useFinancialRecord = (id: string) => {
  return useQuery({
    queryKey: financialRecordKeys.detail(id),
    queryFn: () => financialRecordApi.getById(id),
    enabled: !!id
  });
};

/**
 * Get financial records by client
 */
export const useFinancialRecordsByClient = (clientId: string) => {
  return useQuery({
    queryKey: financialRecordKeys.byClient(clientId),
    queryFn: () => financialRecordApi.getByClient(clientId),
    enabled: !!clientId
  });
};

/**
 * Get financial records by order
 */
export const useFinancialRecordsByOrder = (orderId: string) => {
  return useQuery({
    queryKey: financialRecordKeys.byOrder(orderId),
    queryFn: () => financialRecordApi.getByOrder(orderId),
    enabled: !!orderId
  });
};

/**
 * Get financial records by date range
 */
export const useFinancialRecordsByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: financialRecordKeys.byDateRange(startDate, endDate),
    queryFn: () => financialRecordApi.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate
  });
};

/**
 * Create financial record
 */
export const useCreateFinancialRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateFinancialRecordPayload) => 
      financialRecordApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financialRecordKeys.all });
      if (data.clientId) {
        queryClient.invalidateQueries({ 
          queryKey: financialRecordKeys.byClient(data.clientId) 
        });
      }
      if (data.orderId) {
        queryClient.invalidateQueries({ 
          queryKey: financialRecordKeys.byOrder(data.orderId) 
        });
      }
    }
  });
};

/**
 * Update financial record
 */
export const useUpdateFinancialRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFinancialRecordPayload }) =>
      financialRecordApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financialRecordKeys.all });
      queryClient.invalidateQueries({ queryKey: financialRecordKeys.detail(data.id) });
      if (data.clientId) {
        queryClient.invalidateQueries({ 
          queryKey: financialRecordKeys.byClient(data.clientId) 
        });
      }
    }
  });
};

/**
 * Delete financial record
 */
export const useDeleteFinancialRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => financialRecordApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialRecordKeys.all });
    }
  });
};
