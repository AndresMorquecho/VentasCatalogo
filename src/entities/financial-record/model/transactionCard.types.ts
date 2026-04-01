/**
 * TransactionCardDTO — Shared contract between backend and frontend.
 *
 * This is the ONLY data shape the frontend is allowed to render.
 * Zero financial logic lives in the frontend.
 */

export type CardTitle =
  | 'PAGO_EFECTIVO'
  | 'TRANSFERENCIA_BANCARIA'
  | 'DEPOSITO_BANCARIO'
  | 'PAGO_CHEQUE'
  | 'USO_BILLETERA'
  | 'RECARGA_BILLETERA'
  | 'TRASPASO_SALDO'
  | 'DEVOLUCION'
  | 'REEMBOLSO_CASH'
  | 'REEMBOLSO_BANCARIO'
  | 'CAMBIO_MISMO_VALOR'
  | 'CAMBIO_CARGO_ADICIONAL'
  | 'CAMBIO_CREDITO';

export type OperationType =
  | 'ABONO'
  | 'ENTREGA'
  | 'RECARGA'
  | 'REEMBOLSO'
  | 'CAMBIO'
  | 'TRASPASO'
  | 'INTERNO';

export type AccountMovementType = 'CASH' | 'BANK' | 'WALLET';
export type MovementDirection = 'IN' | 'OUT';
export type CardMovementType = 'INCOME' | 'EXPENSE' | 'INTERNAL';

export interface CardMovement {
  accountType: AccountMovementType;    // CASH | BANK | WALLET
  accountName: string;                 // "Caja", "Banco Pichincha", "Billetera Virtual"
  direction: MovementDirection;        // IN | OUT
  amount: number;
  balanceBefore: number | null;
  balanceAfter: number | null;
  informative: boolean; // if true → does NOT count in cash closure totals
}

export interface CardOrderContext {
  orderId: string | null;
  receiptNumber: string;
  orderNumber: string | null;
  brandName: string | null;
}

export interface TransactionCardDTO {
  // Identity
  id: string;
  rawRecordIds: string[];
  // Header — all pre-computed by backend
  title: CardTitle;
  titleLabel: string;           // e.g. "Pago en Efectivo"
  operationType: OperationType; // e.g. "ENTREGA"
  movementType: CardMovementType;
  totalAmount: number;          // Real net amount (non-informative movements only)
  date: string;
  createdBy: string;
  reference: string | null;
  // Client
  clientName: string;
  clientDocument: string | null;
  // Context
  orders: CardOrderContext[];   // All orders involved
  brands: string[];             // Unique brand names
  // Financial — ONLY source for cash closure
  movements: CardMovement[];
  // Flags — pre-computed, no frontend logic needed
  affectsCash: boolean;
  affectsBank: boolean;
  affectsWallet: boolean;
  isInternal: boolean;
  notes: string | null;
  extra: string | null;
}
