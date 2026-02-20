export type FinancialMovementType = 'INCOME' | 'EXPENSE';
export type FinancialMovementSource = 'ORDER_PAYMENT' | 'MANUAL' | 'ADJUSTMENT';

export interface FinancialMovement {
    id: string;
    type: FinancialMovementType;
    source: FinancialMovementSource;
    amount: number;
    description?: string;
    
    // Relations
    bankAccountId: string;
    referenceId?: string; // e.g. Order ID or OrderPayment ID
    
    // Client Information (denormalized for reporting)
    clientId?: string;
    clientName?: string;
    
    // Payment Information
    paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';
    
    // User Information (denormalized for auditing)
    createdBy: string;
    createdByName?: string;
    
    // Metadata
    createdAt: string;
    updatedAt?: string;
}

export type CreateFinancialMovementPayload = Omit<FinancialMovement, 'id' | 'createdAt' | 'updatedAt'>;
