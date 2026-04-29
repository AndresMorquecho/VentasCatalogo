export type BankAccountType = 'CASH' | 'BANK' | 'VIRTUAL'

export interface BankAccount {
    id: string;
    // New fields
    name: string;
    type: BankAccountType;
    currentBalance: number;
    isActive: boolean;
    createdAt: string;

    bankName?: string;
    accountNumber?: string;
    holderName?: string;
    description?: string;
    periodIncome?: number;
    periodExpense?: number;
    periodNet?: number;
}

export interface BankAccountPayload {
    name: string;
    type: BankAccountType;
    currentBalance: number;
    isActive: boolean;
    bank_name?: string;
    account_number?: string;
    holder_name?: string;
    description?: string;
}
