import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from './catalogApi';
import type {
  CreateInventoryRequest,
  CreateDeliveryRequest,
  ValidateBehaviorRequest,
  InventoryFilters,
  DeliveryFilters
} from '../model/types';

export function useCatalogInventory(filters?: InventoryFilters) {
  return useQuery({
    queryKey: ['catalog-inventory', filters],
    queryFn: () => catalogApi.getInventory(filters),
    placeholderData: (prev) => prev
  });
}

export function useCreateCatalogInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryRequest) => catalogApi.createInventory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-inventory'] });
    }
  });
}

export function useValidateClientBehavior() {
  return useMutation({
    mutationFn: (data: ValidateBehaviorRequest) => catalogApi.validateBehavior(data)
  });
}

export function useCreateCatalogDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDeliveryRequest) => catalogApi.createDelivery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-deliveries'] });
    }
  });
}

export function useCatalogDeliveries(filters?: DeliveryFilters) {
  return useQuery({
    queryKey: ['catalog-deliveries', filters],
    queryFn: () => catalogApi.getDeliveries(filters),
    placeholderData: (prev) => prev
  });
}
