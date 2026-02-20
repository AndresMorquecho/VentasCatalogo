/**
 * Financial Calculator for Orders
 * 
 * Centralizes all financial calculations to ensure consistency
 * across the application. All UI components should use these
 * functions instead of calculating directly.
 * 
 * Business Logic:
 * - Order has initial total (estimated)
 * - Order can have realInvoiceTotal (actual) after reception
 * - Payments are tracked in payments[] array
 * - If payment exceeds pending, excess becomes client credit
 */

import type { Order } from './types';
import { getEffectiveTotal, getPaidAmount, getPendingAmount } from './model';

/**
 * Calculate pending balance for an order.
 * Uses realInvoiceTotal if available, otherwise uses initial total.
 * 
 * @param order - The order to calculate pending balance for
 * @returns Pending amount (always >= 0)
 */
export const calculatePendingBalance = (order: Order): number => {
    return Math.max(0, getPendingAmount(order));
};

/**
 * Calculate credit generated from a payment that exceeds pending balance.
 * 
 * Example:
 * - Order total: $50
 * - Already paid: $20
 * - Pending: $30
 * - New payment: $40
 * - Credit generated: $10
 * 
 * @param order - The order
 * @param paymentAmount - Amount being paid
 * @returns Credit amount (0 if payment doesn't exceed pending)
 */
export const calculateCreditFromPayment = (
    order: Order,
    paymentAmount: number
): number => {
    const pending = calculatePendingBalance(order);
    return paymentAmount > pending ? paymentAmount - pending : 0;
};

/**
 * Calculate how a payment should be distributed between order and credit.
 * 
 * @param order - The order
 * @param paymentAmount - Amount being paid
 * @returns Distribution: { toOrder, toCredit }
 */
export const calculatePaymentDistribution = (
    order: Order,
    paymentAmount: number
): { toOrder: number; toCredit: number } => {
    const pending = calculatePendingBalance(order);
    
    if (paymentAmount <= pending) {
        return { toOrder: paymentAmount, toCredit: 0 };
    }
    
    return { toOrder: pending, toCredit: paymentAmount - pending };
};

/**
 * Calculate adjustment when order is received with different invoice total.
 * 
 * Business Logic:
 * - Client orders $50, pays $20 advance
 * - Real invoice is $30 (discount)
 * - Adjustment: $30 - $20 = $10 still pending
 * 
 * OR:
 * - Client orders $50, pays $40 advance
 * - Real invoice is $30 (discount)
 * - Adjustment: $30 - $40 = -$10 (credit to client)
 * 
 * @param order - The order (before reception)
 * @param realInvoiceTotal - Actual invoice amount
 * @returns Adjustment details
 */
export const calculateReceptionAdjustment = (
    order: Order,
    realInvoiceTotal: number
): {
    newPending: number;
    creditGenerated: number;
    additionalPaymentNeeded: number;
    adjustmentType: 'CREDIT' | 'ADDITIONAL_PAYMENT' | 'EXACT';
} => {
    const paid = getPaidAmount(order);
    const difference = realInvoiceTotal - paid;
    
    if (Math.abs(difference) < 0.01) {
        // Exact match (within floating point tolerance)
        return {
            newPending: 0,
            creditGenerated: 0,
            additionalPaymentNeeded: 0,
            adjustmentType: 'EXACT'
        };
    }
    
    if (difference < 0) {
        // Client overpaid - generate credit
        return {
            newPending: 0,
            creditGenerated: Math.abs(difference),
            additionalPaymentNeeded: 0,
            adjustmentType: 'CREDIT'
        };
    }
    
    // Client needs to pay more
    return {
        newPending: difference,
        creditGenerated: 0,
        additionalPaymentNeeded: difference,
        adjustmentType: 'ADDITIONAL_PAYMENT'
    };
};

/**
 * Validate if a payment amount is valid for an order.
 * 
 * @param order - The order
 * @param paymentAmount - Amount to validate
 * @returns Validation result
 */
export const validatePaymentAmount = (
    order: Order,
    paymentAmount: number
): { valid: boolean; error?: string; warning?: string } => {
    if (paymentAmount <= 0) {
        return { valid: false, error: 'El monto debe ser mayor a 0' };
    }
    
    const pending = calculatePendingBalance(order);
    
    if (paymentAmount > pending) {
        const credit = paymentAmount - pending;
        return {
            valid: true,
            warning: `El pago excede el saldo pendiente. Se generará un crédito de $${credit.toFixed(2)}`
        };
    }
    
    return { valid: true };
};

/**
 * Calculate maximum allowed payment for editing an existing payment.
 * 
 * When editing a payment, the maximum is:
 * current pending + original payment amount
 * 
 * @param order - The order
 * @param originalPaymentAmount - Original payment amount being edited
 * @returns Maximum allowed amount
 */
export const calculateMaxEditPaymentAmount = (
    order: Order,
    originalPaymentAmount: number
): number => {
    const pending = calculatePendingBalance(order);
    return pending + originalPaymentAmount;
};

/**
 * Format currency for display.
 * 
 * @param amount - Amount to format
 * @returns Formatted string (e.g., "$50.00")
 */
export const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
};

/**
 * Calculate percentage paid.
 * 
 * @param order - The order
 * @returns Percentage (0-100)
 */
export const calculatePaymentPercentage = (order: Order): number => {
    const total = getEffectiveTotal(order);
    if (total === 0) return 0;
    
    const paid = getPaidAmount(order);
    return Math.min(100, (paid / total) * 100);
};
