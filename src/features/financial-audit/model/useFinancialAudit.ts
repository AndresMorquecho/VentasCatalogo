import { useMemo } from 'react';
import { useFinancialMovements, getBalanceByBankAccount } from '@/entities/financial-movement/model';
import { useBankAccountList } from '@/entities/bank-account/model/hooks';

export interface BankAccountAudit {
    accountId: string;
    accountName: string;
    accountType: string;
    calculatedBalance: number;  // From ledger (movements)
    reportedBalance: number;    // From BankAccount entity
    difference: number;
    hasDiscrepancy: boolean;
    movementCount: number;
}

export interface FinancialAuditData {
    audits: BankAccountAudit[];
    totalDiscrepancies: number;
    loading: boolean;
    error: Error | null;
}

/**
 * Hook for Financial Audit
 * Compares calculated balances (from movements) with reported balances (from BankAccount)
 * NO business logic - only orchestration + pure query application
 */
export function useFinancialAudit(): FinancialAuditData {
    const { data: movements = [], isLoading: loadingMovements, error: movementsError } = useFinancialMovements();
    const { data: bankAccounts = [], isLoading: loadingAccounts, error: accountsError } = useBankAccountList();

    const audits = useMemo<BankAccountAudit[]>(() => {
        return bankAccounts.map(account => {
            // Use pure query from entity
            const calculatedBalance = getBalanceByBankAccount(movements, account.id);
            const reportedBalance = account.currentBalance;
            const difference = Math.abs(calculatedBalance - reportedBalance);
            
            // Count movements for this account
            const movementCount = movements.filter(m => m.bankAccountId === account.id).length;

            return {
                accountId: account.id,
                accountName: account.name,
                accountType: account.type === 'CASH' ? 'Efectivo' : 'Banco',
                calculatedBalance,
                reportedBalance,
                difference,
                hasDiscrepancy: difference > 0.01, // Threshold for floating point precision
                movementCount
            };
        });
    }, [movements, bankAccounts]);

    const totalDiscrepancies = useMemo(() => {
        return audits.filter(a => a.hasDiscrepancy).length;
    }, [audits]);

    return {
        audits,
        totalDiscrepancies,
        loading: loadingMovements || loadingAccounts,
        error: (movementsError || accountsError) as Error | null
    };
}
