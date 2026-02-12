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
    
    // Metadata
    createdAt: string;
    updatedAt?: string;
}

export type CreateFinancialMovementPayload = Omit<FinancialMovement, 'id' | 'createdAt' | 'updatedAt'>;
