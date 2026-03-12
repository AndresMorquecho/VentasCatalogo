// Inventory API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { InventoryMovement } from "@/entities/inventory-movement/model/types";
import type { PaginatedResponse } from "@/entities/order/model/types";

export const inventoryApi = {
  /**
   * Create inventory movement
   * @endpoint POST /api/inventory/movements
   */
  create: async (data: Omit<InventoryMovement, 'id' | 'date'>): Promise<InventoryMovement> => {
    return httpClient.post<InventoryMovement>('/inventory/movements', data);
  },

  /**
   * Get all inventory movements with pagination
   * @endpoint GET /api/inventory/movements
   */
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    type?: string; 
    brandId?: string; 
    orderId?: string;
    startDate?: string;
    endDate?: string;
    receiptNumber?: string;
    orderNumber?: string;
    search?: string;
  }): Promise<PaginatedResponse<InventoryMovement>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const url = `/inventory/movements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return httpClient.get<PaginatedResponse<InventoryMovement>>(url);
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
