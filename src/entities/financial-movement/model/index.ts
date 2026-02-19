// Types
export type {
    FinancialMovement,
    FinancialMovementType,
    FinancialMovementSource,
    CreateFinancialMovementPayload,
} from './types';

// Domain functions (pure, no side effects)
export {
    createFinancialMovement,
    updateFinancialMovement,
} from './model';

// Pure query functions (no side effects)
export {
    getTotalIncome,
    getTotalExpense,
    getNetBalance,
    getBalanceByBankAccount,
    getMovementsByDateRange,
    getCashFlowSummary,
    getMovementsByDate,
    getMovementsBySource,
    getMovementsByType,
} from './queries';

export type { CashFlowSummary } from './queries';
