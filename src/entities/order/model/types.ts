export type OrderStatus = 'RECIBIDO' | 'POR_RECIBIR' | 'ATRASADO' | 'CANCELADO' | 'RECIBIDO_EN_BODEGA' | 'ENTREGADO';
export type SalesChannel = 'OFICINA' | 'WHATSAPP' | 'DOMICILIO';
export type OrderType = 'NORMAL' | 'PREVENTA' | 'REPROGRAMACION';
export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';

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
    bankAccountId?: string; // Optional now as cash doesn't strictly need it per transaction item
    method?: string; // EFECTIVO, TRANSFERENCIA, etc.
    reference?: string;
    createdAt: string;
    description?: string;
}

export interface Order {
    id: string;
    receiptNumber: string; 
    salesChannel: SalesChannel;
    type: OrderType;
    brandId: string; // Mandatory linkage to Brand entity
    brandName: string; // Denormalized name for display 
    
    // Financials
    total: number; // Initial / Estimated Total
    realInvoiceTotal?: number; // Actual Invoice Total upon reception
    paymentMethod: PaymentMethod;
    bankAccountId?: string; 
    transactionDate?: string; 

    // Payment History
    payments: OrderPayment[];
    // REMOVED: paidAmount - Use getPaidAmount(order) instead to avoid data inconsistency

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
    brandId: string; 
    total: number;
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
    // REMOVED: paidAmount - Calculated from payments[] array
}
