export type DepositStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type Bank = 'PICHINCHA' | 'GUAYAQUIL' | 'PRODUBANCO' | 'OTHER';

export interface Deposit {
    id: string;
    clientId: string;
    referenceNumber: string;
    bank: Bank;
    amount: number;
    date: string;
    status: DepositStatus;
    receiptUrl?: string;
    notes?: string;
}

export interface DepositPayload {
    clientId: string;
    referenceNumber: string;
    bank: Bank;
    amount: number;
    date: string;
    status: DepositStatus;
    notes?: string;
}
