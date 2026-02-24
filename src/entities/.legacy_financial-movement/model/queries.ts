import type { FinancialMovement, FinancialMovementType, FinancialMovementSource } from './types';

/**
 * Pure function to calculate total income from movements
 */
export const getTotalIncome = (movements: FinancialMovement[]): number => {
    return movements
        .filter(m => m.type === 'INCOME')
        .reduce((sum, m) => sum + m.amount, 0);
};

/**
 * Pure function to calculate total expenses from movements
 */
export const getTotalExpense = (movements: FinancialMovement[]): number => {
    return movements
        .filter(m => m.type === 'EXPENSE')
        .reduce((sum, m) => sum + m.amount, 0);
};

/**
 * Pure function to calculate net balance (income - expense)
 */
export const getNetBalance = (movements: FinancialMovement[]): number => {
    return getTotalIncome(movements) - getTotalExpense(movements);
};

/**
 * Pure function to calculate balance for a specific bank account
 */
export const getBalanceByBankAccount = (
    movements: FinancialMovement[],
    bankAccountId: string
): number => {
    return movements
        .filter(m => m.bankAccountId === bankAccountId)
        .reduce((balance, m) => {
            return m.type === 'INCOME' 
                ? balance + m.amount 
                : balance - m.amount;
        }, 0);
};

/**
 * Pure function to filter movements by date range
 */
export const getMovementsByDateRange = (
    movements: FinancialMovement[],
    fromDate: string | Date,
    toDate: string | Date
): FinancialMovement[] => {
    const from = new Date(fromDate).getTime();
    const to = new Date(toDate).getTime();
    
    return movements.filter(m => {
        const movementDate = new Date(m.createdAt).getTime();
        return movementDate >= from && movementDate <= to;
    });
};

/**
 * Cash flow summary result type
 */
export interface CashFlowSummary {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    byType: {
        income: number;
        expense: number;
    };
    bySource: Record<FinancialMovementSource, {
        income: number;
        expense: number;
        count: number;
    }>;
    byBankAccount: Record<string, {
        income: number;
        expense: number;
        balance: number;
        count: number;
    }>;
    movementCount: number;
}

/**
 * Pure function to generate comprehensive cash flow summary
 */
export const getCashFlowSummary = (movements: FinancialMovement[]): CashFlowSummary => {
    const totalIncome = getTotalIncome(movements);
    const totalExpense = getTotalExpense(movements);
    
    // Group by source
    const bySource: CashFlowSummary['bySource'] = {
        ORDER_PAYMENT: { income: 0, expense: 0, count: 0 },
        MANUAL: { income: 0, expense: 0, count: 0 },
        ADJUSTMENT: { income: 0, expense: 0, count: 0 }
    };
    
    // Group by bank account
    const byBankAccount: CashFlowSummary['byBankAccount'] = {};
    
    movements.forEach(m => {
        // By source
        bySource[m.source].count++;
        if (m.type === 'INCOME') {
            bySource[m.source].income += m.amount;
        } else {
            bySource[m.source].expense += m.amount;
        }
        
        // By bank account
        if (!byBankAccount[m.bankAccountId]) {
            byBankAccount[m.bankAccountId] = {
                income: 0,
                expense: 0,
                balance: 0,
                count: 0
            };
        }
        
        byBankAccount[m.bankAccountId].count++;
        if (m.type === 'INCOME') {
            byBankAccount[m.bankAccountId].income += m.amount;
            byBankAccount[m.bankAccountId].balance += m.amount;
        } else {
            byBankAccount[m.bankAccountId].expense += m.amount;
            byBankAccount[m.bankAccountId].balance -= m.amount;
        }
    });
    
    return {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        byType: {
            income: totalIncome,
            expense: totalExpense
        },
        bySource,
        byBankAccount,
        movementCount: movements.length
    };
};

/**
 * Pure function to group movements by date (YYYY-MM-DD)
 */
export const getMovementsByDate = (
    movements: FinancialMovement[]
): Record<string, FinancialMovement[]> => {
    return movements.reduce((grouped, movement) => {
        const date = movement.createdAt.split('T')[0]; // Extract YYYY-MM-DD
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(movement);
        return grouped;
    }, {} as Record<string, FinancialMovement[]>);
};

/**
 * Pure function to get movements by source type
 */
export const getMovementsBySource = (
    movements: FinancialMovement[],
    source: FinancialMovementSource
): FinancialMovement[] => {
    return movements.filter(m => m.source === source);
};

/**
 * Pure function to get movements by type
 */
export const getMovementsByType = (
    movements: FinancialMovement[],
    type: FinancialMovementType
): FinancialMovement[] => {
    return movements.filter(m => m.type === type);
};
