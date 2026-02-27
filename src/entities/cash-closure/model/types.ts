export interface CashClosureBalanceByBank {
    bankAccountId: string;
    bankAccountName: string;
    balance: number;
}

export interface CashClosure {
    id: string;
    closedAt: string; // Date of closure
    fromDate: string; // Period start
    toDate: string;   // Period end
    
    // Financial Snapshot
    totalIncome: number;
    totalExpense: number;
    expectedAmount: number; // System balance
    actualAmount: number;   // Counted cash
    difference: number;     // actual - expected
    
    movementCount: number;

    // Metadata
    createdAt: string;
    notes?: string;
    closedBy: string;
    
    // Detailed Report (for PDF regeneration)
    detailedReport?: any; 
}

export interface CreateCashClosurePayload {
    toDate: string;
    actualAmount: number;
    notes?: string;
    // adding missing properties that are returned in createCashClosureSnapshot
    fromDate?: string;
    totalIncome?: number;
    totalExpense?: number;
    netTotal?: number;
    balanceByBank?: CashClosureBalanceByBank[];
    movementCount?: number;
}

export type CashClosureSummary = CashClosure;
