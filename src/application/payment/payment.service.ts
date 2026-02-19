// Application Layer - Payment Service
// Transactional logic moved from shared/api/paymentApi.ts

import { orderApi } from '@/entities/order/model/api';
import { transactionApi, clientCreditApi } from '@/shared/api/transactionApi';
import { bankAccountApi } from '@/shared/api/bankAccountApi';
import type { FinancialTransactionPayload } from '@/shared/api/transactionApi';

export interface PaymentPayload {
    orderId: string;
    clientId: string;
    amount: number;
    method: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'DEPOSITO' | 'CREDITO_CLIENTE';
    referenceNumber?: string; // Required for non-cash
    notes?: string;
    createdBy: string;
}

/**
 * Payment Service
 * 
 * Handles transactional operations for payment registration.
 * Coordinates multiple entities: Order, Transaction, ClientCredit, BankAccount
 * 
 * TODO: When backend is ready, replace with single API calls:
 * - POST /api/payments
 * - DELETE /api/payments/:id
 */
export const paymentService = {
    /**
     * Process a Payment Registration (Abono)
     * Centralized logic for financial consistency.
     */
    registerPayment: async (payload: PaymentPayload): Promise<void> => {
        const { orderId, amount, method, referenceNumber, createdBy, notes, clientId } = payload;

        // 1. Validate Core Logic
        if (amount <= 0) throw new Error("El monto del abono debe ser mayor a 0.");
        if (method !== 'EFECTIVO' && !referenceNumber) throw new Error("Referencia es obligatoria para este método de pago.");

        // 2. Fetch Order to Validate Balance
        const order = await orderApi.getById(orderId);
        if (!order) throw new Error("Pedido no encontrado.");

        const currentPaid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
        const pendingBalance = (order.realInvoiceTotal || order.total) - currentPaid;

        // 3. Handle Overpayment -> Credit Generation
        let paymentAmount = amount;
        let creditAmount = 0;

        if (amount > pendingBalance) {
            paymentAmount = pendingBalance; // Cap payment to debt
            creditAmount = amount - pendingBalance; // Excess is credit
        }

        // 4. Register Financial Transaction (Source of Truth)
        // If effective payment > 0
        if (paymentAmount > 0) {
            // Create Transaction Record
            const txPayload: FinancialTransactionPayload = {
                amount: paymentAmount,
                type: method === 'EFECTIVO' ? 'EFECTIVO' : 'TRANSFERENCIA', // Simplify for now or expand types
                referenceNumber: referenceNumber || `ABONO-${order.receiptNumber}-${Date.now()}`,
                date: new Date().toISOString(),
                clientId: clientId,
                createdBy: createdBy,
                notes: notes || `Abono a pedido #${order.receiptNumber}`,
                orderId: orderId
            };
            
            await transactionApi.createTransaction(txPayload);

            // Update Order Balance (This adds to order.payments array)
            const newPayment = {
                id: `PAY-${Date.now()}`,
                amount: paymentAmount,
                createdAt: new Date().toISOString(), // Use createdAt to match OrderPayment
                method: method,
                reference: referenceNumber,
                description: notes
            };
            
            const updatedPayments = [...(order.payments || []), newPayment];
            await orderApi.update(orderId, { payments: updatedPayments });

            // 5. Impact Cash Account (Only if CASH)
            if (method === 'EFECTIVO') {
                const accounts = await bankAccountApi.getAll();
                const cashAccount = accounts.find(a => a.type === 'CASH');
                if (cashAccount) {
                    // This should ideally use bankAccountApi.addMovement but for now direct update mock
                    const newBalance = cashAccount.currentBalance + paymentAmount;
                    await bankAccountApi.update(cashAccount.id, { currentBalance: newBalance });
                }
            }
        }

        // 6. Generate Client Credit if Overpayment
        if (creditAmount > 0) {
             const creditTx = await transactionApi.createTransaction({
                amount: creditAmount,
                type: 'AJUSTE', // Credit generation is an adjustment or specific type
                referenceNumber: `CREDITO-${order.receiptNumber}-${Date.now()}`,
                date: new Date().toISOString(),
                clientId: clientId,
                createdBy: createdBy,
                notes: `Saldo a favor generado por exceso en abono pedido #${order.receiptNumber}`,
                orderId: orderId
            });

            await clientCreditApi.createCredit({
                clientId: clientId,
                amount: creditAmount,
                originTransactionId: creditTx.id
            });
        }
    },

    /**
     * Get Payment History for an Order
     * Returns list of payments from the order entity combined with transaction details optionally
     */
    getHistory: async (orderId: string) => {
        const order = await orderApi.getById(orderId);
        if (!order) return [];
        return order.payments || [];
    },

     /**
     * Delete/Revert a Payment
     * Complex transaction reversion logic mock using Transaction API
     */
    revertPayment: async (orderId: string, paymentId: string) => {
        // TBD: Logic for reversion is complex. 
        // 1. Find payment in order
        // 2. Remove payment from order
        // 3. Find associated transaction
        // 4. Create Reversal Transaction (Negative)
        // 5. Deduct from Cash if applicable
        console.log("Revert payment logic to be implemented fully via Transaction API");
        
        const order = await orderApi.getById(orderId);
        if (!order) throw new Error("Order not found");

        const payment = (order.payments || []).find(p => p.id === paymentId);
        if (!payment) throw new Error("Payment not found");

        // Remove from order
        const updatedPayments = (order.payments || []).filter(p => p.id !== paymentId);
        await orderApi.update(orderId, { payments: updatedPayments });

        // Deduct from Cash (Mock Reversal)
        if (payment.method === 'EFECTIVO') {
             const accounts = await bankAccountApi.getAll();
             const cashAccount = accounts.find(a => a.type === 'CASH');
             if (cashAccount) {
                 await bankAccountApi.update(cashAccount.id, { currentBalance: cashAccount.currentBalance - payment.amount });
             }
        }
    }
};
