
export type CallReason = 'COBRO' | 'SEGUIMIENTO_PEDIDO' | 'VENTA' | 'RECORDATORIO';
export type CallResult = 'NO_CONTESTA' | 'INTERESADO' | 'NO_INTERESADO' | 'AGENDAR' | 'PAGO_PROMETIDO';

export type CallRecord = {
  id: string;
  clientId: string;
  reason: CallReason;
  result: CallResult;
  observations?: string;
  createdAt: string;
  createdBy: string; // User email or ID
};
