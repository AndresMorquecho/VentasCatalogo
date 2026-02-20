import type { Order, OrderPayment, OrderPayload } from "./types";
import type { BankAccount } from "@/entities/bank-account/model/types";

/**
 * Validates the core structure of an order payload.
 * Checks for mandatory Brand ID and other required fields.
 * Does NOT check existence in DB (infrastructure concern).
 */
export function validateOrderPayload(payload: OrderPayload): void {
    if (!payload.brandId || payload.brandId.trim().length === 0) {
        throw new Error("El ID de la marca es obligatorio");
    }
    if (!payload.clientId || payload.clientId.trim().length === 0) {
        throw new Error("El ID del cliente es obligatorio");
    }
    // Validation of deposit logic is implicit in types (number)
}

/**
 * Calculates total paid amount.
 * ONLY sums payments[] — deposit is no longer a separate financial concept.
 * All money that enters the system MUST go through payments[].
 */
export function getPaidAmount(order: Order): number {
    return (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
}

/**
 * Get effective total (real invoice or estimated).
 */
export function getEffectiveTotal(order: Order): number {
    return order.realInvoiceTotal ?? order.total;
}

/**
 * Calculates pending amount.
 * Can be negative if client has credit (saldo a favor).
 */
export function getPendingAmount(order: Order): number {
    return getEffectiveTotal(order) - getPaidAmount(order);
}

/**
 * Check if order has client credit (saldo a favor).
 * Returns true if pending is negative.
 */
export function hasClientCredit(order: Order): boolean {
    return getPendingAmount(order) < -0.01;
}

/**
 * Get client credit amount (absolute value of negative pending).
 * Returns 0 if no credit.
 */
export function getClientCreditAmount(order: Order): number {
    const pending = getPendingAmount(order);
    return pending < -0.01 ? Math.abs(pending) : 0;
}

/**
 * Lifecycle: Receive Order in Warehouse.
 * 
 * Business Logic:
 * - If realInvoiceTotal < paidAmount: Client has credit (saldo a favor)
 * - If realInvoiceTotal > paidAmount: Client still owes money
 * - If realInvoiceTotal = paidAmount: Exact match
 * 
 * The credit generation is handled by reception.service.ts
 */
export function receiveOrder(order: Order, realInvoiceTotal: number, invoiceNumber?: string): Order {
    if (order.status === 'RECIBIDO_EN_BODEGA' || order.status === 'ENTREGADO') {
        throw new Error("El pedido ya fue recibido anteriormente");
    }

    if (typeof realInvoiceTotal !== 'number' || !Number.isFinite(realInvoiceTotal) || realInvoiceTotal <= 0) {
        throw new Error("El valor real de factura debe ser un número positivo válido");
    }

    // NO validar que realInvoiceTotal >= paidAmount
    // Si realInvoiceTotal < paidAmount, se genera crédito a favor del cliente
    // Esto se maneja en reception.service.ts

    return {
        ...order,
        status: 'RECIBIDO_EN_BODEGA',
        realInvoiceTotal,
        invoiceNumber,
        receptionDate: new Date().toISOString()
    };
}

/**
 * Lifecycle: Deliver Order to Client.
 */
export function deliverOrder(order: Order): Order {
    if (order.status !== 'RECIBIDO_EN_BODEGA') {
        throw new Error("El pedido debe ser recibido en bodega antes de entregar");
    }

    return {
        ...order,
        status: 'ENTREGADO',
        deliveryDate: new Date().toISOString()
    };
}

/**
 * Add a payment to an order.
 * Recalculates paidAmount from payments[] only (no deposit).
 */
export function addPayment(
    order: Order,
    payment: { amount: number },
    bankAccount: BankAccount
): { updatedOrder: Order; updatedBankAccount: BankAccount; newPayment: OrderPayment } {
    if (payment.amount <= 0) throw new Error("El monto debe ser mayor a 0");

    const pending = getPendingAmount(order);
    if (payment.amount > pending + 0.01) throw new Error("El monto supera el saldo pendiente");

    // Clamp to exactly pending if within floating point tolerance
    const finalAmount = Math.min(payment.amount, pending);

    const newPayment: OrderPayment = {
        id: crypto.randomUUID(),
        amount: finalAmount,
        bankAccountId: bankAccount.id,
        createdAt: new Date().toISOString(),
    };

    const updatedPayments = [...(order.payments || []), newPayment];

    const updatedOrder: Order = {
        ...order,
        payments: updatedPayments,
        // REMOVED: paidAmount calculation - use getPaidAmount() instead
    };

    const updatedBankAccount: BankAccount = {
        ...bankAccount,
        currentBalance: bankAccount.currentBalance + finalAmount,
    };

    return { updatedOrder, updatedBankAccount, newPayment };
}

/**
 * Edit a payment in an order.
 * Recalculates paidAmount from payments[] only.
 */
export function editPayment(
    order: Order,
    paymentId: string,
    newAmount: number,
    bankAccount: BankAccount
): { updatedOrder: Order; updatedBankAccount: BankAccount } {
    if (newAmount <= 0) throw new Error("El monto debe ser mayor a 0");

    const paymentIndex = order.payments?.findIndex(p => p.id === paymentId);
    if (paymentIndex === undefined || paymentIndex === -1) throw new Error("Pago no encontrado");

    const originalPayment = order.payments![paymentIndex];

    if (originalPayment.bankAccountId !== bankAccount.id) {
        throw new Error("La cuenta bancaria no coincide con la del pago original");
    }

    const difference = newAmount - originalPayment.amount;

    const pending = getPendingAmount(order);
    if (difference > pending + 0.01) throw new Error("El nuevo monto supera el saldo pendiente");

    const updatedPayments = [...(order.payments || [])];
    updatedPayments[paymentIndex] = { ...originalPayment, amount: newAmount };

    const updatedOrder: Order = {
        ...order,
        payments: updatedPayments,
        // REMOVED: paidAmount calculation - use getPaidAmount() instead
    };

    const updatedBankAccount: BankAccount = {
        ...bankAccount,
        currentBalance: bankAccount.currentBalance + difference
    };

    return { updatedOrder, updatedBankAccount };
}

/**
 * Remove a payment from an order.
 * Recalculates paidAmount from payments[] only.
 */
export function removePayment(
    order: Order,
    paymentId: string,
    bankAccount: BankAccount
): { updatedOrder: Order; updatedBankAccount: BankAccount } {
    const payment = order.payments?.find(p => p.id === paymentId);
    if (!payment) throw new Error("Pago no encontrado");

    if (payment.bankAccountId !== bankAccount.id) {
        throw new Error("La cuenta bancaria no coincide con la del pago original");
    }

    const updatedPayments = order.payments?.filter(p => p.id !== paymentId) || [];

    const updatedOrder: Order = {
        ...order,
        payments: updatedPayments,
        // REMOVED: paidAmount calculation - use getPaidAmount() instead
    };

    const updatedBankAccount: BankAccount = {
        ...bankAccount,
        currentBalance: bankAccount.currentBalance - payment.amount
    };

    return { updatedOrder, updatedBankAccount };
}
