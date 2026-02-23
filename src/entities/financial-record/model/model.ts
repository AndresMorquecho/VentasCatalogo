// Financial Record Domain Model

import type { 
  FinancialRecord, 
  CreateFinancialRecordPayload,
  FinancialRecordType,
  FinancialSource,
  MovementType
} from './types';

/**
 * Create a new financial record
 */
export const createFinancialRecord = (
  payload: CreateFinancialRecordPayload
): FinancialRecord => {
  return {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
    version: 1
  };
};

/**
 * Helper to create payment record
 */
export const createPaymentRecord = (
  orderId: string,
  orderReceiptNumber: string,
  amount: number,
  clientId: string,
  clientName: string,
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE',
  bankAccountId: string,
  createdBy: string,
  notes?: string
): FinancialRecord => {
  const referenceNumber = `PAY-${orderReceiptNumber}-${Date.now()}`;
  
  return createFinancialRecord({
    type: 'PAYMENT',
    source: 'ORDER_PAYMENT',
    movementType: 'INCOME',
    referenceNumber,
    amount,
    date: new Date().toISOString(),
    clientId,
    clientName,
    orderId,
    createdBy,
    notes: notes || `Pago pedido #${orderReceiptNumber}`,
    bankAccountId,
    paymentMethod
  });
};

/**
 * Helper to create adjustment record (for credits)
 */
export const createAdjustmentRecord = (
  orderId: string,
  orderReceiptNumber: string,
  amount: number,
  clientId: string,
  clientName: string,
  bankAccountId: string,
  reason: string,
  createdBy: string
): FinancialRecord => {
  const referenceNumber = `AJUSTE-${orderReceiptNumber}-${Date.now()}`;
  
  return createFinancialRecord({
    type: 'ADJUSTMENT',
    source: 'ADJUSTMENT',
    movementType: 'INCOME',
    referenceNumber,
    amount,
    date: new Date().toISOString(),
    clientId,
    clientName,
    orderId,
    createdBy,
    notes: reason,
    bankAccountId,
    paymentMethod: 'EFECTIVO'
  });
};

/**
 * Helper to create manual record
 */
export const createManualRecord = (
  amount: number,
  clientId: string,
  clientName: string,
  bankAccountId: string,
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE',
  createdBy: string,
  notes: string,
  movementType: MovementType = 'INCOME'
): FinancialRecord => {
  const referenceNumber = `MANUAL-${Date.now()}`;
  
  return createFinancialRecord({
    type: movementType === 'EXPENSE' ? 'EXPENSE' : 'PAYMENT',
    source: 'MANUAL',
    movementType,
    referenceNumber,
    amount,
    date: new Date().toISOString(),
    clientId,
    clientName,
    createdBy,
    notes,
    bankAccountId,
    paymentMethod
  });
};

/**
 * Calculate balance for a specific bank account from financial records
 */
export const getBalanceByBankAccount = (
  records: FinancialRecord[],
  bankAccountId: string
): number => {
  return records
    .filter(record => record.bankAccountId === bankAccountId)
    .reduce((balance, record) => {
      if (record.movementType === 'INCOME') {
        return balance + record.amount;
      } else if (record.movementType === 'EXPENSE') {
        return balance - record.amount;
      }
      return balance;
    }, 0);
};

/**
 * Get all records for a specific bank account
 */
export const getRecordsByBankAccount = (
  records: FinancialRecord[],
  bankAccountId: string
): FinancialRecord[] => {
  return records.filter(record => record.bankAccountId === bankAccountId);
};

/**
 * Get records by client
 */
export const getRecordsByClient = (
  records: FinancialRecord[],
  clientId: string
): FinancialRecord[] => {
  return records.filter(record => record.clientId === clientId);
};

/**
 * Get records by date range
 */
export const getRecordsByDateRange = (
  records: FinancialRecord[],
  startDate: string,
  endDate: string
): FinancialRecord[] => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return records.filter(record => {
    const recordDate = new Date(record.date).getTime();
    return recordDate >= start && recordDate <= end;
  });
};

/**
 * Calculate total income from financial records
 */
export const getTotalIncome = (records: FinancialRecord[]): number => {
  return records
    .filter(r => r.movementType === 'INCOME')
    .reduce((sum, r) => sum + r.amount, 0);
};

/**
 * Calculate total expenses from financial records
 */
export const getTotalExpense = (records: FinancialRecord[]): number => {
  return records
    .filter(r => r.movementType === 'EXPENSE')
    .reduce((sum, r) => sum + r.amount, 0);
};

/**
 * Calculate net balance (income - expense)
 */
export const getNetBalance = (records: FinancialRecord[]): number => {
  return getTotalIncome(records) - getTotalExpense(records);
};

/**
 * Cash flow summary result type
 */
export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  byType: {
    income: number;
    expense: number;
  };
  bySource: Record<FinancialSource, {
    income: number;
    expense: number;
    count: number;
  }>;
  byBankAccount: Record<string, {
    income: number;
    expense: number;
    balance: number;
    count: number;
  }>;
  movementCount: number;
}

/**
 * Generate comprehensive cash flow summary
 */
export const getCashFlowSummary = (records: FinancialRecord[]): CashFlowSummary => {
  const totalIncome = getTotalIncome(records);
  const totalExpense = getTotalExpense(records);
  
  // Group by source
  const bySource: CashFlowSummary['bySource'] = {
    ORDER_PAYMENT: { income: 0, expense: 0, count: 0 },
    MANUAL: { income: 0, expense: 0, count: 0 },
    ADJUSTMENT: { income: 0, expense: 0, count: 0 }
  };
  
  // Group by bank account
  const byBankAccount: CashFlowSummary['byBankAccount'] = {};
  
  records.forEach(r => {
    // By source
    bySource[r.source].count++;
    if (r.movementType === 'INCOME') {
      bySource[r.source].income += r.amount;
    } else {
      bySource[r.source].expense += r.amount;
    }
    
    // By bank account
    if (!byBankAccount[r.bankAccountId]) {
      byBankAccount[r.bankAccountId] = {
        income: 0,
        expense: 0,
        balance: 0,
        count: 0
      };
    }
    
    byBankAccount[r.bankAccountId].count++;
    if (r.movementType === 'INCOME') {
      byBankAccount[r.bankAccountId].income += r.amount;
      byBankAccount[r.bankAccountId].balance += r.amount;
    } else {
      byBankAccount[r.bankAccountId].expense += r.amount;
      byBankAccount[r.bankAccountId].balance -= r.amount;
    }
  });
  
  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    byType: {
      income: totalIncome,
      expense: totalExpense
    },
    bySource,
    byBankAccount,
    movementCount: records.length
  };
};

/**
 * Get records by source type
 */
export const getRecordsBySource = (
  records: FinancialRecord[],
  source: FinancialSource
): FinancialRecord[] => {
  return records.filter(r => r.source === source);
};

/**
 * Get records by movement type
 */
export const getRecordsByMovementType = (
  records: FinancialRecord[],
  movementType: MovementType
): FinancialRecord[] => {
  return records.filter(r => r.movementType === movementType);
};
