import type { 
    CashClosureDetailedReport, 
    CashClosureMovementDetail,
    CashClosureIncomeBySource,
    CashClosureIncomeByMethod,
    CashClosureMovementsByUser
} from './detailed-types';
import type { FinancialMovement } from '@/entities/financial-movement/model/types';
import type { BankAccount } from '@/entities/bank-account/model/types';

/**
 * Creates a detailed cash closure report with complete breakdown
 */
export function createDetailedCashClosureReport(
    fromDate: string,
    toDate: string,
    movements: FinancialMovement[],
    bankAccounts: BankAccount[],
    closedBy: string,
    closedByName?: string,
    notes?: string
): CashClosureDetailedReport {
    console.log('[DEBUG] createDetailedCashClosureReport called with:', {
        fromDate,
        toDate,
        movementsCount: movements.length,
        bankAccountsCount: bankAccounts.length,
        closedBy
    });

    // 1. Filter movements by date range (using local date comparison)
    const rangeMovements = movements.filter(m => {
        // Extract just the date part (YYYY-MM-DD) from the ISO string
        const movementDate = m.createdAt.split('T')[0];
        return movementDate >= fromDate && movementDate <= toDate;
    });

    console.log('[DEBUG] Filtered movements:', {
        total: movements.length,
        inRange: rangeMovements.length,
        fromDate,
        toDate,
        sampleMovementDates: movements.slice(0, 3).map(m => m.createdAt),
        movements: rangeMovements
    });

    // 2. Calculate totals
    const totalIncome = rangeMovements
        .filter(m => m.type === 'INCOME')
        .reduce((sum, m) => sum + m.amount, 0);
    
    const totalExpense = rangeMovements
        .filter(m => m.type === 'EXPENSE')
        .reduce((sum, m) => sum + m.amount, 0);
    
    const netTotal = totalIncome - totalExpense;

    // 3. Income by source
    const incomeMovements = rangeMovements.filter(m => m.type === 'INCOME');
    
    const incomeBySource: CashClosureIncomeBySource = {
        orderPayments: incomeMovements
            .filter(m => m.source === 'ORDER_PAYMENT' && m.description?.includes('inicial'))
            .reduce((sum, m) => sum + m.amount, 0),
        additionalPayments: incomeMovements
            .filter(m => m.source === 'ORDER_PAYMENT' && !m.description?.includes('inicial'))
            .reduce((sum, m) => sum + m.amount, 0),
        adjustments: incomeMovements
            .filter(m => m.source === 'ADJUSTMENT')
            .reduce((sum, m) => sum + m.amount, 0),
        manual: incomeMovements
            .filter(m => m.source === 'MANUAL')
            .reduce((sum, m) => sum + m.amount, 0),
    };

    // 4. Income by payment method
    const incomeByMethod: CashClosureIncomeByMethod = {
        EFECTIVO: incomeMovements
            .filter(m => m.paymentMethod === 'EFECTIVO')
            .reduce((sum, m) => sum + m.amount, 0),
        TRANSFERENCIA: incomeMovements
            .filter(m => m.paymentMethod === 'TRANSFERENCIA')
            .reduce((sum, m) => sum + m.amount, 0),
        DEPOSITO: incomeMovements
            .filter(m => m.paymentMethod === 'DEPOSITO')
            .reduce((sum, m) => sum + m.amount, 0),
        CHEQUE: incomeMovements
            .filter(m => m.paymentMethod === 'CHEQUE')
            .reduce((sum, m) => sum + m.amount, 0),
    };

    // 5. Balance by bank account
    const balanceByBank = bankAccounts.map(account => {
        const accountMovements = rangeMovements.filter(m => m.bankAccountId === account.id);
        const income = accountMovements
            .filter(m => m.type === 'INCOME')
            .reduce((sum, m) => sum + m.amount, 0);
        const expense = accountMovements
            .filter(m => m.type === 'EXPENSE')
            .reduce((sum, m) => sum + m.amount, 0);
        
        return {
            bankAccountId: account.id,
            bankAccountName: account.name,
            balance: income - expense
        };
    });

    // 6. Movements by user
    const userMap = new Map<string, CashClosureMovementsByUser>();
    
    rangeMovements.forEach(m => {
        if (!userMap.has(m.createdBy)) {
            userMap.set(m.createdBy, {
                userId: m.createdBy,
                userName: m.createdByName || m.createdBy,
                totalIncome: 0,
                totalExpense: 0,
                movementCount: 0
            });
        }
        
        const userStats = userMap.get(m.createdBy)!;
        userStats.movementCount++;
        
        if (m.type === 'INCOME') {
            userStats.totalIncome += m.amount;
        } else {
            userStats.totalExpense += m.amount;
        }
    });
    
    const movementsByUser = Array.from(userMap.values())
        .sort((a, b) => (b.totalIncome + b.totalExpense) - (a.totalIncome + a.totalExpense));

    // 7. Detailed movement list
    const movementDetails: CashClosureMovementDetail[] = rangeMovements.map(m => {
        const account = bankAccounts.find(a => a.id === m.bankAccountId);
        
        return {
            id: m.id,
            date: m.createdAt,
            type: m.type,
            source: m.source,
            amount: m.amount,
            clientName: m.clientName,
            paymentMethod: m.paymentMethod,
            bankAccountName: account?.name || 'Desconocida',
            createdBy: m.createdBy,
            createdByName: m.createdByName,
            description: m.description
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
        movementCount: rangeMovements.length,
        incomeBySource,
        incomeByMethod,
        balanceByBank,
        movementsByUser,
        movements: movementDetails
    };
}
