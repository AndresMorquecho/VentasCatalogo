import type { CallReason, CallResult } from './types';

export const CALL_REASONS: CallReason[] = ['COBRO', 'SEGUIMIENTO_PEDIDO', 'VENTA', 'RECORDATORIO', 'OTRO'];
export const CALL_RESULTS: CallResult[] = ['CONTESTA', 'NO_CONTESTA', 'OCUPADO', 'EQUIVOCADO', 'PAGO_PROMETIDO', 'INTERESADO', 'NO_INTERESADO'];

export const callReasonsMap: Record<CallReason, string> = {
    COBRO: 'Cobro de saldo',
    SEGUIMIENTO_PEDIDO: 'Seguimiento de pedido',
    VENTA: 'Venta / Catálogo',
    RECORDATORIO: 'Recordatorio',
    OTRO: 'Otro'
};

export const callResultsMap: Record<CallResult, string> = {
    CONTESTA: 'Contesta',
    NO_CONTESTA: 'No contesta',
    OCUPADO: 'Ocupado',
    EQUIVOCADO: 'Número equivocado',
    PAGO_PROMETIDO: 'Promesa de pago',
    INTERESADO: 'Interesado',
    NO_INTERESADO: 'No interesado'
};
