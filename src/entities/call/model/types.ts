export type CallReason = 'COBRO' | 'SEGUIMIENTO_PEDIDO' | 'VENTA' | 'RECORDATORIO' | 'OTRO';
export type CallResult = 'CONTESTA' | 'NO_CONTESTA' | 'OCUPADO' | 'EQUIVOCADO' | 'PAGO_PROMETIDO' | 'INTERESADO' | 'NO_INTERESADO';

export interface Call {
    id: string;
    clientId: string;
    orderId?: string | null;
    reason: CallReason;
    result: CallResult;
    notes?: string | null;
    followUpDate?: string | null;
    createdBy: string;
    createdAt: string;
    // Relations (optional for display)
    client?: {
        firstName: string;
        identificationNumber: string;
    };
}

export interface CallPayload {
    clientId: string;
    orderId?: string | null;
    reason: CallReason;
    result: CallResult;
    notes?: string | null;
    followUpDate?: string | null;
}
