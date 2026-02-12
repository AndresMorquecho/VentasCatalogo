export type OrderStatus = 'RECIBIDO' | 'POR_RECIBIR' | 'ATRASADO' | 'CANCELADO' | 'RECIBIDO_EN_BODEGA' | 'ENTREGADO';
export type SalesChannel = 'OFICINA' | 'WHATSAPP' | 'DOMICILIO';
export type OrderType = 'NORMAL' | 'PREVENTA' | 'REPROGRAMACION';
export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA';

export interface OrderItem {
    id: string;
    productName: string; 
    quantity: number;
    unitPrice: number;
    brandId?: string;
    brandName?: string; 
    link?: string;
}

export type OrderPayment = {
    id: string;
    amount: number;
    bankAccountId: string;
    createdAt: string;
}

export interface Order {
    id: string;
    receiptNumber: string; 
    salesChannel: SalesChannel;
    type: OrderType;
    brandId?: string; 
    brandName: string; 
    
    // Financials
    total: number; // Initial / Estimated Total
    realInvoiceTotal?: number; // Actual Invoice Total upon reception
    deposit: number; // Abono inicial
    // balance removed - use getPendingAmount(order)
    paymentMethod: PaymentMethod;
    bankAccountId?: string; 
    transactionDate?: string; 

    // Payment History
    payments: OrderPayment[];
    paidAmount: number; // Total pagado (deposit + payments)

    // Dates
    createdAt: string;
    possibleDeliveryDate: string; 
    receptionDate?: string; // Date received in warehouse
    deliveryDate?: string; // Date delivered to client
    invoiceNumber?: string; // Official Invoice Number (optional)
    
    status: OrderStatus;
    
    // Relations
    clientId: string;
    clientName: string;
    items: OrderItem[];
    notes?: string;
}

export interface OrderPayload {
    salesChannel: SalesChannel;
    type: OrderType;
    brandName: string;
    brandId?: string; 
    total: number;
    deposit: number;
    // balance removed
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    transactionDate?: string;
    possibleDeliveryDate: string;
    status: OrderStatus;
    clientId: string;
    clientName: string;
    items: OrderItem[];
    notes?: string;
    receiptNumber: string;
    // Financials update
    payments?: OrderPayment[];
    paidAmount?: number;
}
