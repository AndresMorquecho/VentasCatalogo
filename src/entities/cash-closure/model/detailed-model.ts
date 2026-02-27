import type { 
    CashClosureDetailedReport, 
    CashClosureMovementDetail,
    CashClosureIncomeBySource,
    CashClosureIncomeByMethod,
    CashClosureMovementsByUser
} from './detailed-types';
import type { FinancialRecord } from '@/entities/financial-record/model/types';
import type { BankAccount } from '@/entities/bank-account/model/types';

/**
 * Creates a detailed cash closure report with complete breakdown
 */
export function createDetailedCashClosureReport(
    fromDate: string,
    toDate: string,
    records: FinancialRecord[],
    bankAccounts: BankAccount[],
    closedBy: string,
    closedByName?: string,
    notes?: string
): CashClosureDetailedReport {
    console.log('[DEBUG] createDetailedCashClosureReport called with:', {
        fromDate,
        toDate,
        recordsCount: records.length,
        bankAccountsCount: bankAccounts.length,
        closedBy
    });

    // 1. Filter records by date range (using local date comparison)
    const rangeRecords = records.filter(r => {
        // Extract just the date part (YYYY-MM-DD) from the ISO string
        const recordDate = r.createdAt.split('T')[0];
        return recordDate >= fromDate && recordDate <= toDate;
    });

    console.log('[DEBUG] Filtered records:', {
        total: records.length,
        inRange: rangeRecords.length,
        fromDate,
        toDate,
        sampleRecordDates: records.slice(0, 3).map(r => r.createdAt),
        records: rangeRecords
    });

    // 2. Calculate totals
    const totalIncome = rangeRecords
        .filter(r => r.movementType === 'INCOME')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpense = rangeRecords
        .filter(r => r.movementType === 'EXPENSE')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const netTotal = totalIncome - totalExpense;

    // 3. Income by source
    const incomeRecords = rangeRecords.filter(r => r.movementType === 'INCOME');
    
    const incomeBySource: CashClosureIncomeBySource = {
        orderPayments: incomeRecords
            .filter(r => r.source === 'ORDER_PAYMENT' && r.notes?.includes('inicial'))
            .reduce((sum, r) => sum + r.amount, 0),
        additionalPayments: incomeRecords
            .filter(r => r.source === 'ORDER_PAYMENT' && !r.notes?.includes('inicial'))
            .reduce((sum, r) => sum + r.amount, 0),
        adjustments: incomeRecords
            .filter(r => r.source === 'ADJUSTMENT')
            .reduce((sum, r) => sum + r.amount, 0),
        manual: incomeRecords
            .filter(r => r.source === 'MANUAL')
            .reduce((sum, r) => sum + r.amount, 0),
    };

    // 4. Income by payment method
    const incomeByMethod: CashClosureIncomeByMethod = {
        EFECTIVO: incomeRecords
            .filter(r => r.paymentMethod === 'EFECTIVO')
            .reduce((sum, r) => sum + r.amount, 0),
        TRANSFERENCIA: incomeRecords
            .filter(r => r.paymentMethod === 'TRANSFERENCIA')
            .reduce((sum, r) => sum + r.amount, 0),
        DEPOSITO: incomeRecords
            .filter(r => r.paymentMethod === 'DEPOSITO')
            .reduce((sum, r) => sum + r.amount, 0),
        CHEQUE: incomeRecords
            .filter(r => r.paymentMethod === 'CHEQUE')
            .reduce((sum, r) => sum + r.amount, 0),
    };

    // 5. Balance by bank account
    const balanceByBank = bankAccounts.map(account => {
        const accountRecords = rangeRecords.filter(r => r.bankAccountId === account.id);
        const income = accountRecords
            .filter(r => r.movementType === 'INCOME')
            .reduce((sum, r) => sum + r.amount, 0);
        const expense = accountRecords
            .filter(r => r.movementType === 'EXPENSE')
            .reduce((sum, r) => sum + r.amount, 0);
        
        return {
            bankAccountId: account.id,
            bankAccountName: account.name,
            balance: income - expense
        };
    });

    // 6. Records by user
    const userMap = new Map<string, CashClosureMovementsByUser>();
    
    rangeRecords.forEach(r => {
        if (!userMap.has(r.createdBy)) {
            userMap.set(r.createdBy, {
                userId: r.createdBy,
                userName: r.createdBy, // FinancialRecord doesn't have createdByName
                totalIncome: 0,
                totalExpense: 0,
                movementCount: 0
            });
        }
        
        const userStats = userMap.get(r.createdBy)!;
        userStats.movementCount++;
        
        if (r.movementType === 'INCOME') {
            userStats.totalIncome += r.amount;
        } else {
            userStats.totalExpense += r.amount;
        }
    });
    
    const movementsByUser = Array.from(userMap.values())
        .sort((a, b) => (b.totalIncome + b.totalExpense) - (a.totalIncome + a.totalExpense));

    // 7. Detailed record list
    const movementDetails: CashClosureMovementDetail[] = rangeRecords.map(r => {
        const account = bankAccounts.find(a => a.id === r.bankAccountId);
        
        return {
            id: r.id,
            date: r.createdAt,
            type: r.movementType, // Map movementType to type
            source: r.source,
            amount: r.amount,
            clientName: r.clientName,
            paymentMethod: r.paymentMethod,
            bankAccountName: account?.name || 'Desconocida',
            createdBy: r.createdBy,
            createdByName: r.createdBy, // FinancialRecord doesn't have createdByName
            description: r.notes
        };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 8. Return complete report
    return {
        fromDate,
        toDate,
        closedBy,
        closedByName,
        closedAt: new Date().toISOString(),
        notes,
        totalIncome,
        totalExpense,
        netTotal,
        movementCount: rangeRecords.length,
        incomeBySource,
        incomeByMethod,
        balanceByBank,
        movementsByUser,
        movements: movementDetails
    };
}
