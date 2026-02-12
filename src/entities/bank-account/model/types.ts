export type BankAccountType = 'CASH' | 'BANK'

export interface BankAccount {
    id: string;
    // New fields
    name: string;
    type: BankAccountType;
    currentBalance: number;
    isActive: boolean;
    createdAt: string;

    // Legacy fields (kept for compatibility with Orders)
    description?: string; // e.g., "Banco Pichincha - Ahorros"
    accountNumber?: string;
    holderName?: string;
    bankName?: string;
}

export interface BankAccountPayload {
    name: string;
    type: BankAccountType;
    currentBalance: number;
    isActive: boolean;
    // Optional legacy needed if creating from old flow? No, creating new flow uses new fields.
}
