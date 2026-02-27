import type { CreateCashClosurePayload, CashClosureBalanceByBank } from './types';
import type { FinancialRecord } from '@/entities/financial-record/model/types';
import type { BankAccount } from '@/entities/bank-account/model/types';
import { 
    getTotalIncome, 
    getTotalExpense, 
    getBalanceByBankAccount 
} from '@/entities/financial-record/model/model';

/**
 * Pure function to calculate and create a Cash Closure snapshot.
 * ALL calculations happen here using pure helper functions from financial-record.
 * Does NOT modify any record. Just creates a read-only snapshot.
 */
export function createCashClosureSnapshot(
    fromDate: string,
    toDate: string,
    records: FinancialRecord[], // Pre-filtered by date range externally or passed all
    bankAccounts: BankAccount[],
    notes?: string
): CreateCashClosurePayload {
    // 1. Filter records by range if not already filtered (defensive)
    const from = new Date(fromDate).getTime();
    const to = new Date(toDate).getTime();
    
    const rangeRecords = records.filter(r => {
        const rDate = new Date(r.createdAt).getTime();
        return rDate >= from && rDate <= to;
    });

    // 2. Calculate Totals
    const totalIncome = getTotalIncome(rangeRecords);
    const totalExpense = getTotalExpense(rangeRecords);
    const netTotal = totalIncome - totalExpense;

    // 3. Calculate Balance per Bank Account (Snapshot of records in this range)
    const balanceByBank: CashClosureBalanceByBank[] = bankAccounts.map(account => ({
        bankAccountId: account.id,
        bankAccountName: account.name,
        // Calculate balance contribution from records in this range
        balance: getBalanceByBankAccount(rangeRecords, account.id) 
    }));

    // 4. Return Payload ready for persistence
    return {
        fromDate,
        toDate,
        notes,
        totalIncome,
        totalExpense,
        netTotal,
        balanceByBank,
        movementCount: rangeRecords.length,
        actualAmount: 0 // Will be filled later by User in CashClosurePage
    };
}
