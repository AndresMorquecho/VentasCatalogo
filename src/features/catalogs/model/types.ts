export type CatalogDeliveryType = 'GRATIS' | 'CON_COSTO';

export interface CatalogInventory {
  id: string;
  brandId: string;
  brandName?: string;
  campaign: string;
  quantity: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogDelivery {
  id: string;
  clientId: string;
  clientName?: string;
  brandId: string;
  brandName?: string;
  campaign: string;
  quantity: number;
  type: CatalogDeliveryType;
  orderId?: string;
  catalogInventoryId: string;
  deliveredBy: string;
  deliveredAt: string;
  notes?: string;
  madeOrder?: boolean;
  lastOrderDate?: string | null;
}

export interface CreateInventoryRequest {
  brand_id: string;
  campaign: string;
  quantity: number;
}

export interface CreateDeliveryRequest {
  client_id: string;
  brand_id: string;
  campaign: string;
  quantity: number;
  type: CatalogDeliveryType;
  order_id?: string;
  notes?: string;
}

export interface ValidateBehaviorRequest {
  client_id: string;
  brand_id: string;
}

export interface BehaviorValidationResult {
  warning: boolean;
  message?: string;
  lastDeliveryDate?: string;
}

export interface InventoryFilters {
  brand_id?: string;
  campaign?: string;
  page?: number;
  limit?: number;
}

export interface DeliveryFilters {
  client_id?: string;
  brand_id?: string;
  campaign?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}
