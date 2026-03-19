import { httpClient } from '@/shared/lib/httpClient';
import type {
  CatalogInventory,
  CatalogDelivery,
  CreateInventoryRequest,
  CreateDeliveryRequest,
  ValidateBehaviorRequest,
  BehaviorValidationResult,
  InventoryFilters,
  DeliveryFilters
} from '../model/types';

export const catalogApi = {
  // Inventario
  createInventory: async (data: CreateInventoryRequest): Promise<CatalogInventory> => {
    return httpClient.post('/catalogs/inventory', data);
  },

  getInventory: async (filters?: InventoryFilters): Promise<{ data: CatalogInventory[]; pagination: any }> => {
    return httpClient.get('/catalogs/inventory', { params: filters });
  },

  // Entregas
  validateBehavior: async (data: ValidateBehaviorRequest): Promise<BehaviorValidationResult> => {
    return httpClient.post('/catalogs/deliveries/validate', data);
  },

  createDelivery: async (data: CreateDeliveryRequest): Promise<CatalogDelivery> => {
    return httpClient.post('/catalogs/deliveries', data);
  },

  getDeliveries: async (filters?: DeliveryFilters): Promise<{ data: CatalogDelivery[]; pagination: any }> => {
    return httpClient.get('/catalogs/deliveries', { params: filters });
  }
};
