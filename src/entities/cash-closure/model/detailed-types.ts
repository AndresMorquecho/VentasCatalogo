export interface CashClosureMovementDetail {
    id: string;
    date: string;
    type: 'INCOME' | 'EXPENSE' | 'INTERNAL';
    source: 'ORDER_PAYMENT' | 'MANUAL' | 'ADJUSTMENT';
    amount: number;
    clientName?: string;
    paymentMethod?: string;
    bankAccountName: string;
    createdBy: string;
    createdByName?: string;
    description?: string;
    moduleLabel?: string; // Human-readable: "Abono inicial pedido PD-XXX", "Recarga billetera", etc.
}

export interface CashClosureIncomeBySource {
    orderPayments: number;       // Abonos iniciales de pedidos
    additionalPayments: number;  // Abonos posteriores (módulo de abonos)
    walletRecharges: number;     // Recargas de billetera (MANUAL source, INCOME)
    adjustments: number;         // Ajustes
    manual: number;              // Otros movimientos manuales
}

export interface CashClosureWalletRechargeByMethod {
    TRANSFERENCIA: number;
    DEPOSITO: number;
    CHEQUE: number;
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

export interface CashClosureAccountBalance {
    bankAccountId: string;
    bankAccountName: string;
    bankAccountType: string;
    initialBalance: number;  // Balance before this period
    income: number;
    expense: number;
    finalBalance: number;    // initialBalance + income - expense
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
    expectedAmount?: number;
    actualAmount?: number;
    difference?: number;

    // Summary (real money only, excludes INTERNAL)
    totalIncome: number;
    totalExpense: number;
    netTotal: number;
    movementCount: number;

    // Detailed Breakdowns
    incomeBySource: CashClosureIncomeBySource;
    walletRechargeByMethod: CashClosureWalletRechargeByMethod;
    incomeByMethod: CashClosureIncomeByMethod;

    // Per-account running balance
    balanceByBank: CashClosureAccountBalance[];

    // Legacy field kept for backward compat
    movementsByUser: CashClosureMovementsByUser[];

    // Full Movement List
    movements: CashClosureMovementDetail[];
}
