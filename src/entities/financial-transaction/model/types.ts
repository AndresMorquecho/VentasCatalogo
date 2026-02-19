export type FinancialTransactionType = 'DEPOSITO' | 'TRANSFERENCIA' | 'CHEQUE' | 'AJUSTE' | 'EFECTIVO';

export type FinancialTransaction = {
  id: string;
  type: FinancialTransactionType;
  referenceNumber: string; // Unique index
  amount: number;
  date: string;
  clientId: string;
  orderId?: string;
  createdBy: string;
  createdAt: string;
  notes?: string;
};
