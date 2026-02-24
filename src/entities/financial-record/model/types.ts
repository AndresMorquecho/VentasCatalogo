// Financial Record Entity - Unified model matching backend
// Replaces FinancialTransaction and FinancialMovement

export type FinancialRecordType = 'PAYMENT' | 'ADJUSTMENT' | 'EXPENSE';
export type FinancialSource = 'ORDER_PAYMENT' | 'MANUAL' | 'ADJUSTMENT';
export type MovementType = 'INCOME' | 'EXPENSE';

export interface FinancialRecord {
  id: string;

  // Type and Classification
  type: FinancialRecordType;
  source: FinancialSource;
  movementType: MovementType;

  // Financial Data
  referenceNumber: string; // Unique identifier
  amount: number;
  date: string;

  // Audit Trail
  clientId: string;
  clientName: string;
  orderId?: string;
  createdBy: string;
  notes?: string;

  // Bank Account
  bankAccountId: string;
  paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE' | 'CREDITO_CLIENTE';

  // Metadata
  createdAt: string;
  version: number;
}

export interface CreateFinancialRecordPayload {
  type: FinancialRecordType;
  source: FinancialSource;
  movementType: MovementType;
  referenceNumber: string;
  amount: number;
  date: string;
  clientId: string;
  clientName: string;
  orderId?: string;
  createdBy: string;
  notes?: string;
  bankAccountId: string;
  paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE' | 'CREDITO_CLIENTE';
}

export interface UpdateFinancialRecordPayload {
  amount?: number;
  notes?: string;
  date?: string;
}
