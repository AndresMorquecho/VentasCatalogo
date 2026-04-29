export interface CashClosureMovementDetail {
    id: string;
    date: string;
    type: string; // INCOME | EXPENSE | INTERNAL
    source: string; // ORDER_PAYMENT | MANUAL | ADJUSTMENT | CATALOG_SALE
    amount: number;
    clientName?: string;
    paymentMethod?: string;
    bankAccountName: string;
    createdBy: string;
    createdByName?: string;
    description?: string;
    moduleLabel?: string;
    isCreditApplication?: boolean; // Flag for virtual wallet usage
}

export interface CashClosureIncomeBySource {
    orderPayments: number;       // 1. Abonos iniciales de pedidos
    deliveryPayments: number;    // 2. Cobros en Entrega
    additionalPayments: number;  // 3. Abonos normales/posteriores
    catalogSales: number;        // 4. Ventas de Catálogo
    walletRecharges: number;     // 5a. Recargas (Resguardo)
    adjustments: number;         // 5b. Ajustes (Resguardo)
    manual: number;              // Otros
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

export interface SummaryTableRecord {
    date: string;
    label?: string; // For "Tipo"
    reference?: string; // For "Referencia" (method/source)
    code?: string; // For "Código" (voucher/id)
    description: string;
    identification?: string; // For "Identificacion"
    client?: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'INTERNAL';
    balance: number;
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
    generatedBy?: string; // Who is downloading/printing
    boxUserName?: string;  // Whose box this is

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

    // New 4 Summary Tables for optimized PDF
    summaryTables?: {
        wallet: SummaryTableRecord[];
        bancos: SummaryTableRecord[];
        abonos: SummaryTableRecord[];
        entregas: SummaryTableRecord[];
        catalog: SummaryTableRecord[];
    };
    totalDetails?: {
        cash: number;
        banks: number;
        accounts: { name: string; type: string; balance: number }[];
    };
}
