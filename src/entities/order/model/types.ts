export type OrderStatus = 'POR_RECIBIR' | 'RECIBIDO_EN_BODEGA' | 'ENTREGADO';
export type SalesChannel = 'OFICINA' | 'WHATSAPP' | 'DOMICILIO';
export type OrderType = 'NORMAL' | 'PREVENTA' | 'REPROGRAMACION';
export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE' | 'CREDITO_CLIENTE';

export interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    brandId?: string;
    brandName?: string;
    link?: string;
    status?: OrderStatus;
    possibleDeliveryDate?: string;
}

export type OrderPayment = {
    id: string;
    amount: number;
    bankAccountId?: string;
    method?: string;
    reference?: string;
    receiptNumber?: string;
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
    orderNumber?: string; // Catalog Order Number (optional)

    // Nuevos campos FASE 3
    parentOrderId?: string;
    trackingGuide?: string;
    changeStatus?: 'OFICINA' | 'EMPRESA' | 'RECIBIDO';

    parentOrder?: Order;
    childOrders?: Order[];
    childOrdersCount?: number;

    status: OrderStatus;

    // Relations
    clientId: string;
    clientName: string;
    items: OrderItem[];
    notes?: string;
    createdByName?: string;   // Usuario que creó el pedido
    receivedByName?: string;  // Usuario que recibió en bodega
    deliveredByName?: string; // Usuario que procesó la entrega
    documentType?: string;    // FACTURA/NOTA_VENTA
    entryDate?: string;       // Fecha de ingreso físico
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
    createdAt?: string; // Manual registration date (ISO string/date string)
    // Financials update
    payments?: OrderPayment[];
    // REMOVED: paidAmount - Calculated from payments[] array

    // Nuevos campos FASE 3
    parentOrderId?: string | null;
    trackingGuide?: string;
    changeStatus?: 'OFICINA' | 'EMPRESA' | 'RECIBIDO';
    orderNumber?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

