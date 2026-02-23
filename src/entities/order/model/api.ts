// Order API - HTTP calls to backend

import { httpClient } from '@/shared/lib/httpClient';
import type { Order, OrderPayload, OrderPayment } from './types';

export const orderApi = {
  /**
   * Get all orders
   * @endpoint GET /api/orders
   */
  getAll: async (): Promise<Order[]> => {
    return httpClient.get<Order[]>('/orders');
  },

  /**
   * Get order by ID
   * @endpoint GET /api/orders/:id
   */
  getById: async (id: string): Promise<Order> => {
    return httpClient.get<Order>(`/orders/${id}`);
  },

  /**
   * Get orders by client
   * @endpoint GET /api/orders?clientId=:clientId
   */
  getByClient: async (clientId: string): Promise<Order[]> => {
    return httpClient.get<Order[]>(`/orders?clientId=${clientId}`);
  },

  /**
   * Get orders by status
   * @endpoint GET /api/orders?status=:status
   */
  getByStatus: async (status: string): Promise<Order[]> => {
    return httpClient.get<Order[]>(`/orders?status=${status}`);
  },

  /**
   * Create new order
   * @endpoint POST /api/orders
   */
  create: async (payload: OrderPayload): Promise<Order> => {
    return httpClient.post<Order>('/orders', payload);
  },

  /**
   * Generate next receipt number
   * @endpoint GET /api/orders/generate-receipt-number
   */
  generateReceiptNumber: async (): Promise<{ receiptNumber: string }> => {
    return httpClient.get<{ receiptNumber: string }>('/orders/generate-receipt-number');
  },

  /**
   * Check if receipt number exists
   * @endpoint GET /api/orders/check-receipt/:receiptNumber
   */
  checkReceiptExists: async (receiptNumber: string): Promise<{ exists: boolean }> => {
    return httpClient.get<{ exists: boolean }>(`/orders/check-receipt/${receiptNumber}`);
  },

  /**
   * Update order
   * @endpoint PUT /api/orders/:id
   */
  update: async (id: string, payload: Partial<OrderPayload>): Promise<Order> => {
    return httpClient.put<Order>(`/orders/${id}`, payload);
  },

  /**
   * Delete order (soft delete)
   * @endpoint DELETE /api/orders/:id
   */
  delete: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/orders/${id}`);
  },

  /**
   * Add payment to order
   * @endpoint POST /api/orders/:id/payments
   */
  addPayment: async (
    orderId: string,
    payment: {
      amount: number;
      bankAccountId: string;
      paymentMethod: string;
      reference?: string;
      description?: string;
    }
  ): Promise<Order> => {
    return httpClient.post<Order>(`/orders/${orderId}/payments`, payment);
  },

  /**
   * Update payment
   * @endpoint PUT /api/orders/:id/payments/:paymentId
   */
  updatePayment: async (
    orderId: string,
    paymentId: string,
    updates: { amount?: number; reference?: string; description?: string }
  ): Promise<Order> => {
    return httpClient.put<Order>(`/orders/${orderId}/payments/${paymentId}`, updates);
  },

  /**
   * Delete payment
   * @endpoint DELETE /api/orders/:id/payments/:paymentId
   */
  deletePayment: async (orderId: string, paymentId: string): Promise<Order> => {
    return httpClient.delete<Order>(`/orders/${orderId}/payments/${paymentId}`);
  },

  /**
   * Receive order (mark as received in warehouse)
   * @endpoint POST /api/orders/:id/receive
   */
  receiveOrder: async (
    orderId: string,
    data: {
      finalTotal: number;
      invoiceNumber: string;
      abonoRecepcion?: number;
    }
  ): Promise<Order> => {
    return httpClient.post<Order>(`/orders/${orderId}/receive`, data);
  },

  /**
   * Batch reception with payments
   * @endpoint POST /api/orders/batch-reception
   */
  batchReception: async (
    items: {
      orderId: string;
      abonoRecepcion: number;
      finalTotal: number;
      finalInvoiceNumber: string;
      paymentMethod?: string;
      bankAccountId?: string;
      referenceNumber?: string;
    }[]
  ): Promise<Order[]> => {
    return httpClient.post<Order[]>('/orders/batch-reception', { items });
  },

  /**
   * Simple batch reception (no payments)
   * @endpoint POST /api/orders/batch-reception-simple
   */
  batchReceptionSimple: async (orderIds: string[]): Promise<Order[]> => {
    return httpClient.post<Order[]>('/orders/batch-reception-simple', { orderIds });
  },

  /**
   * Deliver order (mark as delivered to client)
   * @endpoint POST /api/orders/:id/deliver
   */
  deliverOrder: async (
    orderId: string,
    data: {
      finalPayment?: number;
      bankAccountId?: string;
      paymentMethod?: string;
      reference?: string;
      notes?: string;
    }
  ): Promise<Order> => {
    return httpClient.post<Order>(`/orders/${orderId}/deliver`, data);
  },

  /**
   * Get delivery list (orders ready to deliver)
   * @endpoint GET /api/orders?status=RECIBIDO_EN_BODEGA
   */
  getDeliveryList: async (): Promise<Order[]> => {
    return httpClient.get<Order[]>('/orders?status=RECIBIDO_EN_BODEGA');
  },

  /**
   * Get delivery history (delivered orders)
   * @endpoint GET /api/orders?status=ENTREGADO
   */
  getDeliveryHistory: async (): Promise<Order[]> => {
    return httpClient.get<Order[]>('/orders?status=ENTREGADO');
  },

  /**
   * Cancel order
   * @endpoint POST /api/orders/:id/cancel
   */
  cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
    return httpClient.post<Order>(`/orders/${orderId}/cancel`, { reason });
  }
};
