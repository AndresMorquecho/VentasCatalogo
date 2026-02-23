import { orderPaymentService } from '@/application/order/orderPayment.service';

/**
 * Order Payment API - Transport Layer
 * 
 * This file now delegates to application/order/orderPayment.service.ts
 * which contains the transactional logic.
 * 
 * When backend is ready, replace service calls with HTTP calls.
 */
import { paymentApi } from './paymentApi';

export const orderPaymentApi = {
    addOrderPaymentTransactional: async ({ order, amount, bankAccount }: any) => {
        return paymentApi.registerPayment({
            orderId: order.id,
            amount: amount,
            method: 'EFECTIVO', // Default assumption for the legacy form
            bankAccountId: bankAccount.id,
            notes: 'Abono manual registrado desde formulario edición'
        });
    },
    editOrderPaymentTransactional: async ({ order, paymentId, newAmount }: any) => {
        return orderPaymentService.editOrderPayment({
            orderId: order.id,
            paymentId: paymentId,
            amount: newAmount
        });
    },
    removeOrderPaymentTransactional: async ({ order, paymentId }: any) => {
        return orderPaymentService.removeOrderPayment({
            orderId: order.id,
            paymentId: paymentId
        });
    }
}
