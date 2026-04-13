import { httpClient } from '@/shared/lib/httpClient';
import type { Order, OrderPayload, PaginatedResponse } from './types';
import type { CreditDistribution } from '@/entities/financial-record/model/types';

export interface OrderQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    clientId?: string;
    brandId?: string;
    search?: string;
    receiptNumber?: string;
    sourceOrderNumber?: string;
    trackingGuide?: string;
    orderNumber?: string;
    onlyParents?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
}

export const orderApi = {
    /**
     * Get orders with filters and pagination
     * @endpoint GET /api/orders
     */
    getAll: async (params?: OrderQueryParams): Promise<PaginatedResponse<Order>> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, value.toString());
                }
            });
        }
        const url = `/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return httpClient.get<PaginatedResponse<Order>>(url);
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
        const response = await httpClient.get<any>(`/orders?clientId=${clientId}`);
        return (response && 'data' in response && 'pagination' in response) ? response.data : response;
    },

    /**
     * Get orders by status
     * @endpoint GET /api/orders?status=:status
     */
    getByStatus: async (status: string): Promise<Order[]> => {
        const response = await httpClient.get<any>(`/orders?status=${status}`);
        return (response && 'data' in response && 'pagination' in response) ? response.data : response;
    },

    create: async (payload: OrderPayload): Promise<Order> => {
        return httpClient.post<Order>('/orders', payload);
    },

    /**
     * Create multiple orders in batch
     * @endpoint POST /api/orders/batch
     */
    batchCreate: async (payload: any): Promise<Order[]> => {
        return httpClient.post<Order[]>('/orders/batch', payload);
    },

    /**
     * Generate next receipt number
     * @endpoint GET /api/orders/generate-receipt-number
     */
    generateReceiptNumber: async (): Promise<{ receiptNumber: string }> => {
        return httpClient.get<{ receiptNumber: string }>('/orders/generate-receipt-number');
    },
    generateOrderNumber: async (): Promise<{ orderNumber: string }> => {
        return httpClient.get<{ orderNumber: string }>('/orders/generate-order-number');
    },
    /** Siguiente CAM-AAAA-NNN (solo secuencia de cambios) */
    generateExchangeReceiptNumber: async (): Promise<{ orderNumber: string }> => {
        return httpClient.get<{ orderNumber: string }>('/orders/generate-exchange-receipt-number');
    },
    /** Asigna siguiente Guia-AAAA-NNN (PDF guía de envío de cambios). POST incrementa contador. */
    allocateExchangeShippingGuideSerial: async (): Promise<{ guideSequential: string }> => {
        return httpClient.post<{ guideSequential: string }>(
            '/orders/allocate-exchange-shipping-guide-serial',
            {}
        );
    },
    generatePackingNumber: async (): Promise<{ packingNumber: string }> => {
        return httpClient.get<{ packingNumber: string }>(`/orders/generate-packing-number?t=${Date.now()}`);
    },
    generateDeliveryNumber: async (): Promise<{ deliveryNumber: string }> => {
        return httpClient.get<{ deliveryNumber: string }>(`/orders/generate-delivery-number?t=${Date.now()}`);
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
     * Batch update multiple orders within the same receipt group.
     * @endpoint PUT /api/orders/receipt/:receiptNumber/bulk-update
     */
    batchUpdate: async (receiptNumber: string, payload: any): Promise<Order[]> => {
        return httpClient.put<Order[]>(`/orders/receipt/${receiptNumber}/bulk-update`, payload);
    },

    /**
     * Update receipt header (metadata)
     * @endpoint PUT /api/orders/receipt-header/:receiptNumber
     */
    updateReceiptHeader: async (receiptNumber: string, payload: any): Promise<any> => {
        return httpClient.put<any>(`/orders/receipt-header/${encodeURIComponent(receiptNumber)}`, payload);
    },

    /**
     * Rename a receipt group (tracking guide).
     * @endpoint PATCH /api/orders/receipt/:receiptNumber/rename
     */
    renameReceipt: async (receiptNumber: string, newReceiptNumber: string): Promise<any> => {
        return httpClient.patch(`/orders/receipt/${encodeURIComponent(receiptNumber)}/rename`, { newReceiptNumber });
    },

    /**
     * Get all orders associated with a specific receipt number.
     * @endpoint GET /api/orders/receipt/:receiptNumber
     */
    getByReceipt: async (receiptNumber: string): Promise<Order[]> => {
        return httpClient.get<Order[]>(`/orders/receipt/${receiptNumber}`);
    },

    delete: async (id: string, cascade: boolean = false): Promise<void> => {
        const url = `/orders/${id}${cascade ? '?cascade=true' : ''}`;
        return httpClient.delete<void>(url);
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
            invoiceNumber?: string;
            abonoRecepcion?: number;
            bankAccountId?: string;
            paymentMethod?: string;
            reprogrammedItemIds?: string[];
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
            documentType?: string;
            entryDate?: string;
            packingNumber?: string;
            packingTotal?: number;
            paymentMethod?: string;
            bankAccountId?: string;
            referenceNumber?: string;
            creditDistribution?: {
                sourceOrderId: string;
                totalCreditAmount: number;
                distributions: {
                    targetOrderId?: string;
                    amount: number;
                    description: string;
                    isCashReturn?: boolean;
                }[];
            };
        }[],
        batchDetails?: { packingNumber?: string, packingTotal?: number, id?: string }
    ): Promise<Order[]> => {
        return httpClient.post<Order[]>('/orders/batch-reception', { items, ...batchDetails });
    },

    /**
     * Delete reception batch (reverts all orders)
     * @endpoint DELETE /api/orders/reception-batches/:id
     */
    deleteReceptionBatch: async (id: string): Promise<{ message: string }> => {
        return httpClient.delete<{ message: string }>(`/orders/reception-batches/${id}`);
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
            payments?: {
                amount: number;
                bankAccountId?: string;
                paymentMethod: string;
                reference?: string;
            }[];
            notes?: string;
            creditDistributions?: CreditDistribution[];
        }
    ): Promise<Order> => {
        return httpClient.post<Order>(`/orders/${orderId}/deliver`, data);
    },

    /**
     * Batch deliver multiple orders for the same client
     * @endpoint POST /api/orders/batch-deliver
     */
    batchDeliver: async (
        orderIds: string[],
        payments?: {
            amount: number;
            bankAccountId?: string;
            paymentMethod: string;
            reference?: string;
        }[],
        creditDistributions?: CreditDistribution[],
        deliveryBatch?: { deliveryNumber: string, id?: string }
    ): Promise<any> => {
        return httpClient.post<any>('/orders/batch-deliver', { orderIds, payments, creditDistributions, ...deliveryBatch });
    },

    /**
     * Get delivery list (orders ready to deliver)
     * @endpoint GET /api/orders?status=RECIBIDO_EN_BODEGA
     */
    getDeliveryList: async (): Promise<Order[]> => {
        const response = await httpClient.get<any>('/orders?status=RECIBIDO_EN_BODEGA');
        return (response && 'data' in response && 'pagination' in response) ? response.data : response;
    },

    /**
     * Get delivery history (delivered orders)
     * @endpoint GET /api/orders?status=ENTREGADO
     */
    getDeliveryHistory: async (): Promise<Order[]> => {
        const response = await httpClient.get<any>('/orders?status=ENTREGADO');
        return (response && 'data' in response && 'pagination' in response) ? response.data : response;
    },

    /**
     * Cancel order
     * @endpoint POST /api/orders/:id/cancel
     */
    cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
        return httpClient.post<Order>(`/orders/${orderId}/cancel`, { reason });
    },

    /**
     * Reverse reception (back to POR_RECIBIR)
     * @endpoint POST /api/orders/:id/reverse-reception
     */
    reverseReception: async (orderId: string): Promise<{ message: string }> => {
        return httpClient.post<{ message: string }>(`/orders/${orderId}/reverse-reception`, {});
    },

    /**
     * Get all reception batches with pagination and filters
     * @endpoint GET /api/orders/reception-batches
     */
    getReceptionBatches: async (params?: { 
        page?: number, 
        limit?: number, 
        startDate?: string, 
        endDate?: string,
        brandId?: string,
        packingNumber?: string,
        search?: string
    }): Promise<PaginatedResponse<any>> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, value.toString());
                }
            });
        }
        return httpClient.get<PaginatedResponse<any>>(`/orders/reception-batches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    },

    /**
     * Get all delivery batches with pagination and filters
     * @endpoint GET /api/orders/delivery-batches
     */
    getDeliveryBatches: async (params?: { 
        page?: number, 
        limit?: number, 
        startDate?: string, 
        endDate?: string,
        clientId?: string,
        orderQuantity?: string,
        search?: string
    }): Promise<PaginatedResponse<any>> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, value.toString());
                }
            });
        }
        return httpClient.get<PaginatedResponse<any>>(`/orders/delivery-batches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    },

    /**
     * Delete delivery batch (reverts all orders)
     * @endpoint DELETE /api/orders/delivery-batches/:id
     */
    deleteDeliveryBatch: async (id: string): Promise<{ message: string }> => {
        return httpClient.delete<{ message: string }>(`/orders/delivery-batches/${id}`);
    },

    /**
     * Dismantle order (Mode Hostile with block OR Normal)
     * @endpoint POST /api/orders/:id/dismantle
     */
    dismantleOrder: async (orderId: string, payload: { mode: 'BLOCK' | 'NORMAL', reason: string }): Promise<void> => {
        return httpClient.post<void>(`/orders/${orderId}/dismantle`, payload);
    },

    /**
     * Reverse delivery (back to RECIBIDO_EN_BODEGA)
     * @endpoint POST /api/orders/:id/reverse-delivery
     */
    reverseDelivery: async (orderId: string): Promise<{ success: boolean }> => {
        return httpClient.post<{ success: boolean }>(`/orders/${orderId}/reverse-delivery`, {});
    },

    /**
     * Exchange Batches
     */
    getExchangeBatches: async (params?: { 
        status?: string, 
        dateFrom?: string, 
        dateTo?: string 
    }): Promise<any[]> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, value.toString());
                }
            });
        }
        return httpClient.get<any[]>(`/exchanges/batches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    },

    updateExchangeBatchStatus: async (id: string, newStatus: string, trackingGuide?: string): Promise<any> => {
        return httpClient.patch<any>(`/exchanges/batches/${encodeURIComponent(id)}/status`, { newStatus, trackingGuide });
    },

    /**
     * Get order IDs that are in active exchange batches (not delivered)
     * @endpoint GET /api/exchanges/active-order-ids
     */
    getActiveExchangeOrderIds: async (clientId?: string): Promise<string[]> => {
        const params = new URLSearchParams();
        if (clientId) params.append('clientId', clientId);
        const qs = params.toString();
        const response = await httpClient.get<{ success: boolean; data: string[] }>(`/exchanges/active-order-ids${qs ? `?${qs}` : ''}`);
        return (response as any).data; // Response.data is the array
    },

    /**
     * Cancel an exchange receipt (CAM-XXXX) and reverse all associated transactions.
     * Returns 409 if any order is in a blocked state (received, delivered, or in active guide).
     * @endpoint DELETE /api/orders/receipt/:receiptNumber
     */
    cancelExchangeReceipt: async (receiptNumber: string): Promise<{ message: string; cancelledCount: number }> => {
        return httpClient.delete<{ message: string; cancelledCount: number }>(`/orders/receipt/${encodeURIComponent(receiptNumber)}`);
    },

    /**
     * Register a payment for a specific order.
     * Handles EFECTIVO (bank account) and BILLETERA_VIRTUAL (client credit).
     */
    createPayment: async (payload: {
        orderId: string;
        amount: number;
        method: string;
        bankAccountId?: string;
        creditAmount?: number;
        description?: string;
        transactionReference?: string;
    }): Promise<any> => {
        return httpClient.post<any>('/payments', payload);
    },

    /**
     * Delete a specific payment record by ID.
     * This reverses the financial transaction (bank account / credit).
     */
    removePayment: async (paymentId: string): Promise<any> => {
        return httpClient.delete<any>(`/payments/${paymentId}`);
    },

    /**
     * Get all payments associated with a specific order.
     */
    getOrderPayments: async (orderId: string): Promise<any[]> => {
        const result = await httpClient.get<any>(`/payments?orderId=${orderId}`);
        return (result as any).data || result || [];
    },
};
