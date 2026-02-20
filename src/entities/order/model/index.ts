// Order Entity - Public API

// Types
export type {
    Order,
    OrderPayload,
    OrderItem,
    OrderPayment,
    OrderStatus,
    SalesChannel,
    OrderType,
    PaymentMethod
} from './types';

// Domain Logic
export {
    validateOrderPayload,
    getPaidAmount,
    getEffectiveTotal,
    getPendingAmount,
    receiveOrder,
    deliverOrder,
    addPayment,
    editPayment,
    removePayment
} from './model';

// Financial Calculations
export {
    calculatePendingBalance,
    calculateCreditFromPayment,
    calculatePaymentDistribution,
    calculateReceptionAdjustment,
    validatePaymentAmount,
    calculateMaxEditPaymentAmount,
    formatCurrency,
    calculatePaymentPercentage
} from './financialCalculator';
