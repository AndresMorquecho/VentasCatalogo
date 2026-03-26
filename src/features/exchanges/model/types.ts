export type ExchangeStatus =
  | 'RECEIVED_FROM_CLIENT'
  | 'SENT_TO_SUPPLIER'
  | 'RECEIVED_FROM_SUPPLIER';

export type ExchangeItemStatus = 'PENDING' | 'PROCESSED';

export type CreditDestination = 'WALLET' | 'CASH_RETURN' | 'DISTRIBUTE';

export type ExchangeBatchStatus = 'ENVIADO' | 'EN_BODEGA' | 'ENTREGADO';

export interface ExchangeBatchItem {
  id: string;
  batchId: string;
  orderId: string;
  clientId: string;
  clientName: string;
  receiptNumber: string;
  orderTotal: string;
  invoiceTotal: string | null;
  paidAmount: string;
  pendingAmount: string;
  notes: string | null;
  financialProcessed?: boolean;
  createdAt: string;
}

export interface ExchangeBatch {
  id: string;
  batchNumber: string;
  trackingGuide: string | null;
  status: ExchangeBatchStatus;
  notes: string | null;
  createdByName: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ExchangeBatchItem[];
}

export interface CreateExchangeBatchDTO {
  trackingGuide?: string;
  notes?: string;
  items: { orderId: string; notes?: string }[];
}

export interface ExchangeItem {
  id: string;
  exchangeId: string;
  originalOrderId: string;
  productName: string;
  originalValue: string;
  newValue: string | null;
  differenceValue: string | null;
  status: ExchangeItemStatus;
  financialProcessed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exchange {
  id: string;
  exchangeNumber: string;
  clientId: string;
  clientName: string;
  status: ExchangeStatus;
  notes: string | null;
  createdByName: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ExchangeItem[];
  client?: {
    id: string;
    firstName: string;
    identificationNumber: string;
    phone1: string;
    city: string;
  };
}

export interface CreateExchangeDTO {
  clientId: string;
  clientName: string;
  notes?: string;
  createdByName?: string;
}

export interface AddItemDTO {
  originalOrderId: string;
  productName: string;
  originalValue: number;
  newValue?: number | null;
}

export interface ProcessFinancialDTO {
  itemId: string;
  creditDestination?: CreditDestination;
  bankAccountId?: string;
}

export interface ProcessResult {
  itemId: string;
  differenceValue: string | null;
  action: string;
  movementType: 'INTERNAL' | 'INCOME' | 'EXPENSE';
  financialRecordId: string | null;
}

export interface ExchangeFilters {
  clientId?: string;
  status?: ExchangeStatus;
  dateFrom?: string;
  dateTo?: string;
  onlyExchanges?: boolean;
}

export interface ReceiveBatchItemDTO {
  batchItemId: string;
  orderId: string;
  newInvoiceValue: number;
  creditDestination?: CreditDestination;
  bankAccountId?: string;
}

export interface ReceiveBatchDTO {
  items: ReceiveBatchItemDTO[];
}

export interface ReceiveBatchResultItem {
  batchItemId: string;
  differenceValue: number;
  action: string;
  movementType: 'INTERNAL' | 'INCOME' | 'EXPENSE';
}

export interface ReceiveBatchResult {
  batchId: string;
  status: string;
  items: ReceiveBatchResultItem[];
}
