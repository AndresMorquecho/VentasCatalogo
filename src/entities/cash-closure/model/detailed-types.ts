export interface CashClosureMovementDetail {
    id: string;
    date: string;
    type: 'INCOME' | 'EXPENSE';
    source: 'ORDER_PAYMENT' | 'MANUAL' | 'ADJUSTMENT';
    amount: number;
    clientName?: string;
    paymentMethod?: string;
    bankAccountName: string;
    createdBy: string;
    createdByName?: string;
    description?: string;
}

export interface CashClosureIncomeBySource {
    orderPayments: number;      // Abonos iniciales de pedidos
    additionalPayments: number; // Abonos posteriores
    adjustments: number;        // Ajustes
    manual: number;            // Movimientos manuales
}

export interface CashClosureIncomeByMethod {
    EFECTIVO: number;
    TRANSFERENCIA: number;
    DEPOSITO: number;
    CHEQUE: number;
}

export interface CashClosureMovementsByUser {
    userId: string;
    userName: string;
    totalIncome: number;
    totalExpense: number;
    movementCount: number;
}

export interface CashClosureDetailedReport {
    // Basic Info
    id?: string;
    fromDate: string;
    toDate: string;
    closedBy: string;
    closedByName?: string;
    closedAt: string;
    notes?: string;
    
    // Summary
    totalIncome: number;
    totalExpense: number;
    netTotal: number;
    movementCount: number;
    
    // Detailed Breakdowns
    incomeBySource: CashClosureIncomeBySource;
    incomeByMethod: CashClosureIncomeByMethod;
    balanceByBank: Array<{
        bankAccountId: string;
        bankAccountName: string;
        balance: number;
    }>;
    movementsByUser: CashClosureMovementsByUser[];
    
    // Full Movement List
    movements: CashClosureMovementDetail[];
}
