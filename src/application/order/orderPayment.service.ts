// Application Layer - Order Payment Service
// Transactional logic moved from shared/api/orderPaymentApi.ts

import { orderApi } from '@/entities/order/model/api';
import { bankAccountApi } from '@/shared/api/bankAccountApi';
import { financialMovementApi } from '@/shared/api/financialMovementApi';
import { addPayment, editPayment, removePayment } from '@/entities/order/model/model';
import { financialRecordService } from '@/application/financial/financialRecord.service';
import type { Order } from '@/entities/order/model/types';
import type { BankAccount } from '@/entities/bank-account/model/types';

/**
 * Order Payment Service
 * 
 * Handles transactional operations for order payments.
 * Coordinates multiple entities: Order, BankAccount, FinancialTransaction, FinancialMovement
 * 
 * TODO: When backend is ready, replace with single API calls:
 * - POST /api/orders/:id/payments
 * - PUT /api/orders/:id/payments/:paymentId
 * - DELETE /api/orders/:id/payments/:paymentId
 */
export const orderPaymentService = {
    addOrderPaymentTransactional: async ({
        order,
        amount,
        bankAccount
    }: {
        order: Order;
        amount: number;
        bankAccount: BankAccount;
    }) => {
        // 1. Domain Logic: Prepare objects
        const { updatedOrder, updatedBankAccount, newPayment } = addPayment(order, { amount }, bankAccount);
        
        // 2. Create Financial Record (both Transaction and Movement)
        const isInitialPayment = !order.payments || order.payments.length === 0;
        const referenceNumber = `PAY-${order.receiptNumber}-${newPayment.id}`;

        try {
            await financialRecordService.createOrderPaymentRecord(
                order.id,
                order.receiptNumber,
                newPayment.amount,
                order.clientId,
                order.clientName,
                order.paymentMethod,
                bankAccount.id,
                referenceNumber,
                'Vendedor', // TODO: Get from auth context
                'Vendedor', // TODO: Get from auth context
                isInitialPayment
            );

            // 3. Update entities
            await bankAccountApi.update(updatedBankAccount.id, { currentBalance: updatedBankAccount.currentBalance });
            await orderApi.update(updatedOrder.id, updatedOrder);
            
            return updatedOrder;
        } catch (error) {
            console.error("Transaction failed, rolling back (mock)", error);
            throw error;
        }
    },

    editOrderPaymentTransactional: async ({
        order,
        paymentId,
        newAmount,
        bankAccount
    }: {
        order: Order;
        paymentId: string;
        newAmount: number;
        bankAccount: BankAccount;
    }) => {
        const { updatedOrder, updatedBankAccount } = editPayment(order, paymentId, newAmount, bankAccount);
        
        // Validation: Movement MUST exist
        const movement = await financialMovementApi.getByReference(paymentId);
        if (!movement) {
            throw new Error(`Inconsistencia: No se encontró movimiento financiero para el pago ${paymentId}`);
        }

        const originalAmount = movement.amount;

        try {
            await financialMovementApi.update(movement.id, { amount: newAmount });
            await bankAccountApi.update(updatedBankAccount.id, { currentBalance: updatedBankAccount.currentBalance });
            await orderApi.update(updatedOrder.id, updatedOrder);
            return updatedOrder;
        } catch (error) {
            // Rollback mock
            await financialMovementApi.update(movement.id, { amount: originalAmount }).catch(() => {});
            throw error;
        }
    },

    removeOrderPaymentTransactional: async ({
        order,
        paymentId,
        bankAccount
    }: {
        order: Order;
        paymentId: string;
        bankAccount: BankAccount;
    }) => {
        const { updatedOrder, updatedBankAccount } = removePayment(order, paymentId, bankAccount);

        const movement = await financialMovementApi.getByReference(paymentId);
        if (!movement) {
             throw new Error(`Inconsistencia: No se encontró movimiento financiero para el pago ${paymentId}`);
        }

        try {
            await financialMovementApi.delete(movement.id);
            await bankAccountApi.update(updatedBankAccount.id, { currentBalance: updatedBankAccount.currentBalance });
            await orderApi.update(updatedOrder.id, updatedOrder);
            return updatedOrder;
        } catch (error) {
            // Rollback mock
            await financialMovementApi.create(movement).catch(() => {});
            throw error;
        }
    }
}
