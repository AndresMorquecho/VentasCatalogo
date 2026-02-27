import { useMemo } from 'react';
import { useFinancialRecords } from '@/entities/financial-record/model/queries';
import { getBalanceByBankAccount } from '@/entities/financial-record/model/model';
import { useBankAccountList } from '@/features/bank-accounts/api/hooks';

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
 * Compares calculated balances (from records) with reported balances (from BankAccount)
 * NO business logic - only orchestration + pure query application
 */
export function useFinancialAudit(): FinancialAuditData {
    const { data: records = [], isLoading: loadingRecords, error: recordsError } = useFinancialRecords();
    const { data: bankAccounts = [], isLoading: loadingAccounts, error: accountsError } = useBankAccountList();

    const audits = useMemo<BankAccountAudit[]>(() => {
        return bankAccounts.map(account => {
            // Use pure query from entity
            const calculatedBalance = getBalanceByBankAccount(records, account.id);
            const reportedBalance = account.currentBalance;
            const difference = Math.abs(calculatedBalance - reportedBalance);
            
            // Count records for this account
            const movementCount = records.filter(r => r.bankAccountId === account.id).length;

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
    }, [records, bankAccounts]);

    const totalDiscrepancies = useMemo(() => {
        return audits.filter(a => a.hasDiscrepancy).length;
    }, [audits]);

    return {
        audits,
        totalDiscrepancies,
        loading: loadingRecords || loadingAccounts,
        error: (recordsError || accountsError) as Error | null
    };
}
