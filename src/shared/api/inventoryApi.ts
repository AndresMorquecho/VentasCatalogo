// Inventory API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { InventoryMovement } from "@/entities/inventory-movement/model/types";

export const inventoryApi = {
  /**
   * Create inventory movement
   * @endpoint POST /api/inventory/movements
   */
  create: async (data: Omit<InventoryMovement, 'id' | 'date'>): Promise<InventoryMovement> => {
    return httpClient.post<InventoryMovement>('/inventory/movements', data);
  },

  /**
   * Get all inventory movements
   * @endpoint GET /api/inventory/movements
   */
  getAll: async (): Promise<InventoryMovement[]> => {
    return httpClient.get<InventoryMovement[]>('/inventory/movements');
  },

  /**
   * Get inventory movements by client
   * @endpoint GET /api/inventory/movements?clientId=:clientId
   */
  getByClient: async (clientId: string): Promise<InventoryMovement[]> => {
    return httpClient.get<InventoryMovement[]>(`/inventory/movements?clientId=${clientId}`);
  },

  /**
   * Get inventory movements by order
   * @endpoint GET /api/inventory/movements?orderId=:orderId
   */
  getByOrder: async (orderId: string): Promise<InventoryMovement[]> => {
    return httpClient.get<InventoryMovement[]>(`/inventory/movements?orderId=${orderId}`);
  },

  /**
   * Get inventory movements by brand
   * @endpoint GET /api/inventory/movements?brandId=:brandId
   */
  getByBrand: async (brandId: string): Promise<InventoryMovement[]> => {
    return httpClient.get<InventoryMovement[]>(`/inventory/movements?brandId=${brandId}`);
  },

  /**
   * Get inventory movement by ID
   * @endpoint GET /api/inventory/movements/:id
   */
  getById: async (id: string): Promise<InventoryMovement> => {
    return httpClient.get<InventoryMovement>(`/inventory/movements/${id}`);
  },

  /**
   * Update inventory movement
   * @endpoint PUT /api/inventory/movements/:id
   */
  update: async (id: string, data: Partial<InventoryMovement>): Promise<InventoryMovement> => {
    return httpClient.put<InventoryMovement>(`/inventory/movements/${id}`, data);
  },

  /**
   * Mark movement as delivered
   * @endpoint PUT /api/inventory/movements/:id/deliver
   */
  markDelivered: async (id: string, deliveryDate: string): Promise<InventoryMovement> => {
    return httpClient.put<InventoryMovement>(`/inventory/movements/${id}/deliver`, { deliveryDate });
  }
};
