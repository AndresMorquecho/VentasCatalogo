// Application Layer - Order Payment Service
// DEPRECATED: This service will be replaced by backend transactional endpoints
// For now, delegates to backend API calls

import { orderApi } from '@/entities/order/model/api';
import type { Order } from '@/entities/order/model/types';

/**
 * Order Payment Service
 * 
 * Delegates payment operations to backend transactional endpoints.
 * Backend handles: Order update, FinancialRecord creation, BankAccount update
 * 
 * Endpoints:
 * - POST /api/orders/:id/payments
 * - PUT /api/orders/:id/payments/:paymentId
 * - DELETE /api/orders/:id/payments/:paymentId
 */
export const orderPaymentService = {
  /**
   * Add payment to order
   * Backend handles transaction atomically
   */
  addOrderPayment: async ({
    orderId,
    amount,
    bankAccountId,
    paymentMethod,
    reference,
    description
  }: {
    orderId: string;
    amount: number;
    bankAccountId: string;
    paymentMethod: string;
    reference?: string;
    description?: string;
  }): Promise<Order> => {
    return orderApi.addPayment(orderId, {
      amount,
      bankAccountId,
      paymentMethod,
      reference,
      description
    });
  },

  /**
   * Edit payment amount
   * Backend handles transaction atomically
   */
  editOrderPayment: async ({
    orderId,
    paymentId,
    amount
  }: {
    orderId: string;
    paymentId: string;
    amount: number;
  }): Promise<Order> => {
    return orderApi.updatePayment(orderId, paymentId, { amount });
  },

  /**
   * Remove payment from order
   * Backend handles transaction atomically
   */
  removeOrderPayment: async ({
    orderId,
    paymentId
  }: {
    orderId: string;
    paymentId: string;
  }): Promise<Order> => {
    return orderApi.deletePayment(orderId, paymentId);
  }
};
