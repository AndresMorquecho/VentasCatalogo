export type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEPOSIT' | 'CARD';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface Payment {
    id: string;
    orderId: string;
    amount: number;
    date: string;
    method: PaymentMethod;
    status: PaymentStatus;
    receiptUrl?: string;
    notes?: string;
}

export interface PaymentPayload {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    receiptUrl?: string;
    notes?: string;
}
