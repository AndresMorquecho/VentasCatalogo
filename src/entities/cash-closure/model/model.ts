import type { CreateCashClosurePayload, CashClosureBalanceByBank } from './types';
import type { FinancialMovement } from '@/entities/financial-movement/model/types';
import type { BankAccount } from '@/entities/bank-account/model/types';
import { 
    getTotalIncome, 
    getTotalExpense, 
    getBalanceByBankAccount 
} from '@/entities/financial-movement/model/queries';

/**
 * Pure function to calculate and create a Cash Closure snapshot.
 * ALL calculations happen here using pure helper functions from financial-movement.
 * Does NOT modify any movement. Just creates a read-only snapshot.
 */
export function createCashClosureSnapshot(
    fromDate: string,
    toDate: string,
    movements: FinancialMovement[], // Pre-filtered by date range externally or passed all
    bankAccounts: BankAccount[],
    notes?: string
): CreateCashClosurePayload {
    // 1. Filter movements by range if not already filtered (defensive)
    const from = new Date(fromDate).getTime();
    const to = new Date(toDate).getTime();
    
    const rangeMovements = movements.filter(m => {
        const mDate = new Date(m.createdAt).getTime();
        return mDate >= from && mDate <= to;
    });

    // 2. Calculate Totals
    const totalIncome = getTotalIncome(rangeMovements);
    const totalExpense = getTotalExpense(rangeMovements);
    const netTotal = totalIncome - totalExpense;

    // 3. Calculate Balance per Bank Account (Snapshot of movements in this range)
    const balanceByBank: CashClosureBalanceByBank[] = bankAccounts.map(account => ({
        bankAccountId: account.id,
        bankAccountName: account.name,
        // Calculate balance contribution from movements in this range
        balance: getBalanceByBankAccount(rangeMovements, account.id) 
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
        movementCount: rangeMovements.length
    };
}
