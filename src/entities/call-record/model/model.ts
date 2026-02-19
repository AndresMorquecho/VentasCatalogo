
import type { CallReason, CallResult } from './types';

export const CALL_REASONS: CallReason[] = ['COBRO', 'SEGUIMIENTO_PEDIDO', 'VENTA', 'RECORDATORIO'];

export const CALL_RESULTS: CallResult[] = ['NO_CONTESTA', 'INTERESADO', 'NO_INTERESADO', 'AGENDAR', 'PAGO_PROMETIDO'];

export const callReasonsMap: Record<CallReason, string> = {
  COBRO: 'Cobro de Cartera',
  SEGUIMIENTO_PEDIDO: 'Seguimiento de Pedido',
  VENTA: 'Venta / Promoción',
  RECORDATORIO: 'Recordatorio'
};

export const callResultsMap: Record<CallResult, string> = {
  NO_CONTESTA: 'No Contesta',
  INTERESADO: 'Interesado',
  NO_INTERESADO: 'No Interesado',
  AGENDAR: 'Agendar Llamada',
  PAGO_PROMETIDO: 'Pago Prometido'
};
