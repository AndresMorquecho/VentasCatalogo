// Application Layer - Order Reception Service
// DEPRECATED: This service will be replaced by backend transactional endpoints
// For now, delegates to backend API calls

import { orderApi } from '@/entities/order/model/api';
import type { Order } from '@/entities/order/model/types';

/**
 * Order Reception Service
 * 
 * Delegates reception operations to backend transactional endpoints.
 * Backend handles: Order update, FinancialRecord creation, ClientCredit, BankAccount, Inventory
 * 
 * Endpoints:
 * - POST /api/orders/batch-reception
 * - POST /api/orders/:id/receive
 */
export const receptionService = {
  /**
   * Batch reception with payments
   * Backend handles all transactional logic atomically
   */
  saveBatchWithPayments: async (
    params: {
      selectedOrders: {
        order: any;
        abonoRecepcion: number;
        finalTotal: number;
        finalInvoiceNumber: string
      }[],
      paymentMethod?: string,
      bankAccountId?: string,
      referenceNumber?: string
    }
  ): Promise<Order[]> => {
    // Transform from component format to API format
    const items = params.selectedOrders.map(so => ({
      orderId: so.order.id,
      abonoRecepcion: so.abonoRecepcion,
      finalTotal: so.finalTotal,
      finalInvoiceNumber: so.finalInvoiceNumber,
      paymentMethod: params.paymentMethod,
      bankAccountId: params.bankAccountId,
      referenceNumber: params.referenceNumber
    }));

    const response = await orderApi.batchReception(items);

    // Backend returns { success: [{data: Order}], errors: [], summary: {} }
    // Extract the actual Order objects from the nested structure
    if (response && typeof response === 'object' && 'success' in response) {
      const batchResponse = response as any;
      return batchResponse.success.map((item: any) => item.data);
    }

    // Fallback: if response is already an array, return as-is
    return response as Order[];
  },

  /**
   * Simple batch reception (no payments)
   * Backend handles all transactional logic atomically
   */
  saveBatch: async (orderIds: string[]): Promise<Order[]> => {
    const response = await orderApi.batchReceptionSimple(orderIds);

    // Backend returns { success: [{data: Order}], errors: [], summary: {} }
    // Extract the actual Order objects from the nested structure
    if (response && typeof response === 'object' && 'success' in response) {
      const batchResponse = response as any;
      return batchResponse.success.map((item: any) => item.data);
    }

    // Fallback: if response is already an array, return as-is
    return response as Order[];
  },

  /**
   * Receive single order
   * Backend handles all transactional logic atomically
   */
  receiveOrder: async ({
    orderId,
    finalTotal,
    invoiceNumber,
    abonoRecepcion,
    bankAccountId,
    paymentMethod
  }: {
    orderId: string;
    finalTotal: number;
    invoiceNumber?: string;
    abonoRecepcion?: number;
    bankAccountId?: string;
    paymentMethod?: string;
  }): Promise<Order> => {
    return orderApi.receiveOrder(orderId, {
      finalTotal,
      invoiceNumber,
      abonoRecepcion,
      bankAccountId,
      paymentMethod
    });
  }
};

// DEPRECATED CODE BELOW - Remove after backend implementation
// This code has been commented out and will be removed once backend endpoints are ready
/*
export const receptionServiceOLD = {
  saveBatchWithPayments: async (items) => {
    // Old implementation removed - now delegates to backend
  },
  saveBatch: async (orders) => {
    // Old implementation removed - now delegates to backend
  }
};
*/
