export interface CashClosureBalanceByBank {
    bankAccountId: string;
    bankAccountName: string;
    balance: number;
}

export interface CashClosure {
    id: string;
    closedAt: string; // ISO Date of closure
    fromDate: string; // Period start
    toDate: string;   // Period end
    
    // Financial Snapshot
    totalIncome: number;
    totalExpense: number;
    netTotal: number;
    
    // Detailed Breakdown
    balanceByBank: CashClosureBalanceByBank[];
    movementCount: number;

    // Metadata
    createdAt: string;
    notes?: string;
    
    // Detailed Report (for PDF regeneration)
    detailedReport?: any; // Will store the full CashClosureDetailedReport
}

export interface CreateCashClosurePayload {
    fromDate: string;
    toDate: string;
    notes?: string;
    // The following are calculated by domain logic, but passed in payload for persistence
    totalIncome: number;
    totalExpense: number;
    netTotal: number;
    balanceByBank: CashClosureBalanceByBank[];
    movementCount: number;
    detailedReport?: any; // Optional detailed report for PDF regeneration
}

// Summary interface for display components (can be same as payload for now)
export type CashClosureSummary = CreateCashClosurePayload;
