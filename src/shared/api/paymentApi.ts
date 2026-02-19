import { paymentService } from '@/application/payment/payment.service';

// Re-export types
export type { PaymentPayload } from '@/application/payment/payment.service';

/**
 * Payment API - Transport Layer
 * 
 * This file now delegates to application/payment/payment.service.ts
 * which contains the transactional logic.
 * 
 * When backend is ready, replace service calls with HTTP calls.
 */
export const paymentApi = {
    registerPayment: paymentService.registerPayment,
    getHistory: paymentService.getHistory,
    revertPayment: paymentService.revertPayment
};
