import type { Order, OrderPayment } from "./types";
import type { BankAccount } from "@/entities/bank-account/model/types";

// Helper puro para calcular monto pagado total sumando depósito + pagos
export function getPaidAmount(order: Order): number {
    const totalPayments = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
    return order.deposit + totalPayments;
}

// Get effective total (real invoice or estimated)
export function getEffectiveTotal(order: Order): number {
    return order.realInvoiceTotal ?? order.total;
}

// Helper puro para calcular pendiente
export function getPendingAmount(order: Order): number {
    return getEffectiveTotal(order) - getPaidAmount(order);
}

// Lifecycle: Receive Order in Warehouse
export function receiveOrder(order: Order, realInvoiceTotal: number, invoiceNumber?: string): Order {
    if (order.status === 'RECIBIDO_EN_BODEGA' || order.status === 'ENTREGADO') {
        throw new Error("El pedido ya fue recibido anteriormente");
    }
    return {
        ...order,
        status: 'RECIBIDO_EN_BODEGA',
        realInvoiceTotal,
        invoiceNumber,
        receptionDate: new Date().toISOString()
    };
}

// Lifecycle: Deliver Order to Client
export function deliverOrder(order: Order): Order {
    // Strict flow: Must be in warehouse (RECIBIDO_EN_BODEGA)
    if (order.status !== 'RECIBIDO_EN_BODEGA') {
        throw new Error("El pedido debe ser recibido en bodega antes de entregar");
    }

    return {
        ...order,
        status: 'ENTREGADO',
        deliveryDate: new Date().toISOString()
    };
}

export function addPayment(
    order: Order,
    payment: { amount: number },
    bankAccount: BankAccount
): { updatedOrder: Order; updatedBankAccount: BankAccount; newPayment: OrderPayment } {
    if (payment.amount <= 0) throw new Error("El monto debe ser mayor a 0");

    const pending = getPendingAmount(order);
    if (payment.amount > pending) throw new Error("El monto supera el saldo pendiente");

    const newPayment: OrderPayment = {
        id: String(Date.now()), // Simula ID único
        amount: payment.amount,
        bankAccountId: bankAccount.id,
        createdAt: new Date().toISOString(),
    };

    // Crear copia segura y recalcular paidAmount
    const updatedPayments = [...(order.payments || []), newPayment];
    // No dependemos de order.paidAmount anterior, recalculamos
    const newPaidAmount = order.deposit + updatedPayments.reduce((acc, p) => acc + p.amount, 0);

    const updatedOrder: Order = {
        ...order,
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        // Eliminado balance
    };

    const updatedBankAccount: BankAccount = {
        ...bankAccount,
        currentBalance: bankAccount.currentBalance + payment.amount,
    };

    return { updatedOrder, updatedBankAccount, newPayment };
}

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

    // Verificar si el incremento excede el pendiente
    const pending = getPendingAmount(order);
    // Si difference > pending, excede.
    if (difference > pending) throw new Error("El nuevo monto supera el saldo pendiente");

    const updatedPayments = [...(order.payments || [])];
    updatedPayments[paymentIndex] = { ...originalPayment, amount: newAmount };

    const newPaidAmount = order.deposit + updatedPayments.reduce((acc, p) => acc + p.amount, 0);

    const updatedOrder: Order = {
        ...order,
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        // Eliminado balance
    };

    const updatedBankAccount: BankAccount = {
        ...bankAccount,
        currentBalance: bankAccount.currentBalance + difference
    };

    return { updatedOrder, updatedBankAccount };
}

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

    const newPaidAmount = order.deposit + updatedPayments.reduce((acc, p) => acc + p.amount, 0);

    const updatedOrder: Order = {
        ...order,
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        // Eliminado balance
    };

    const updatedBankAccount: BankAccount = {
        ...bankAccount,
        currentBalance: bankAccount.currentBalance - payment.amount
    };

    return { updatedOrder, updatedBankAccount };
}
