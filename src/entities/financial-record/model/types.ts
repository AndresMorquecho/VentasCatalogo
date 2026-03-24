// Financial Record Entity - Unified model matching backend
// Replaces FinancialTransaction and FinancialMovement

export type FinancialRecordType = 'PAYMENT' | 'ADJUSTMENT' | 'EXPENSE' | 'CREDIT_GENERATION' | 'CREDIT_APPLICATION'
    | 'EXCHANGE_SAME_VALUE' | 'EXCHANGE_ADDITIONAL_CHARGE' | 'EXCHANGE_CREDIT' | 'CASH_RETURN';
export type FinancialSource = 'ORDER_PAYMENT' | 'MANUAL' | 'ADJUSTMENT' | 'RECEPTION_OVERPAYMENT' | 'CREDIT_DISTRIBUTION' | 'EXCHANGE';
export type MovementType = 'INCOME' | 'EXPENSE' | 'INTERNAL';

export type AccountType =
  | 'EXTERNAL'
  | 'BANK_ACCOUNT'
  | 'CASH'
  | 'WALLET'
  | 'ORDER'
  | 'VIRTUAL';

export interface FinancialRecord {
  id: string;

  // Type and Classification
  type: FinancialRecordType;
  source: FinancialSource;
  movementType: MovementType;

  // Financial Data
  referenceNumber: string; // Unique identifier (internal)
  userReference?: string;  // Comprobante del usuario (transferencia, depósito, cheque)
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
  bankAccountName?: string; // Nombre de la cuenta bancaria
  paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE' | 'CREDITO_CLIENTE' | 'SALDO_A_FAVOR' | 'BILLETERA_VIRTUAL';

  // Double-entry accounting
  fromAccountType?: AccountType;
  toAccountType?: AccountType;
  transactionGroupId?: string;

  // Balance snapshot (calculated at creation time)
  balanceBefore?: number;
  balanceAfter?: number;

  // Client identification
  clientDocument?: string;

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
  paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE' | 'CREDITO_CLIENTE' | 'SALDO_A_FAVOR' | 'BILLETERA_VIRTUAL';
}

export interface UpdateFinancialRecordPayload {
  amount?: number;
  notes?: string;
  date?: string;
}

// ============================================================================
// CREDIT DISTRIBUTION TYPES
// ============================================================================

export interface CreditDistribution {
  sourceOrderId: string;
  totalCreditAmount: number;
  distributions: CreditDistributionItem[];
}

export interface CreditDistributionItem {
  targetOrderId?: string; // null = billetera virtual
  amount: number;
  description: string;
  isCashReturn?: boolean; // true = devolución en efectivo
}

export interface CreditDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceOrder: {
    id: string;
    receiptNumber: string;
    clientId: string;
    clientName: string;
  };
  creditAmount: number;
  availableOrders: Array<{
    id: string;
    receiptNumber: string;
    clientName: string;
    pendingAmount: number;
  }>;
  onDistribute: (distribution: CreditDistribution) => void;
}