import { orderPaymentService } from '@/application/order/orderPayment.service';

/**
 * Order Payment API - Transport Layer
 * 
 * This file now delegates to application/order/orderPayment.service.ts
 * which contains the transactional logic.
 * 
 * When backend is ready, replace service calls with HTTP calls.
 */
export const orderPaymentApi = {
    addOrderPaymentTransactional: orderPaymentService.addOrderPaymentTransactional,
    editOrderPaymentTransactional: orderPaymentService.editOrderPaymentTransactional,
    removeOrderPaymentTransactional: orderPaymentService.removeOrderPaymentTransactional
}
