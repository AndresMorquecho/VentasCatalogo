import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../shared/ui/dialog';
import { Button } from '../../../shared/ui/button';
import { Badge } from '../../../shared/ui/badge';
import { useUpdateExchangeStatus, useProcessExchangeFinancial } from '../model/useExchanges';
import type { Exchange, ExchangeItem, CreditDestination } from '../model/types';

const STATUS_LABELS: Record<string, string> = {
  RECEIVED_FROM_CLIENT: 'Recibido del cliente',
  SENT_TO_SUPPLIER: 'Enviado al proveedor',
  RECEIVED_FROM_SUPPLIER: 'Recibido del proveedor',
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED_FROM_CLIENT: 'bg-yellow-100 text-yellow-800',
  SENT_TO_SUPPLIER: 'bg-blue-100 text-blue-800',
  RECEIVED_FROM_SUPPLIER: 'bg-green-100 text-green-800',
};

interface FinancialFormState {
  creditDestination: CreditDestination;
  bankAccountId: string;
}

interface Props {
  exchange: Exchange;
  bankAccounts?: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}

export function ExchangeDetailModal({ exchange, bankAccounts = [], open, onClose }: Props) {
  const [financialForms, setFinancialForms] = useState<Record<string, FinancialFormState>>({});
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useUpdateExchangeStatus();
  const processFinancial = useProcessExchangeFinancial();

  const handleStatusChange = async (newStatus: string) => {
    setError(null);
    try {
      await updateStatus.mutateAsync({ id: exchange.id, newStatus });
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado');
    }
  };

  const getFinancialForm = (itemId: string): FinancialFormState =>
    financialForms[itemId] ?? { creditDestination: 'WALLET', bankAccountId: '' };

  const setFinancialForm = (itemId: string, patch: Partial<FinancialFormState>) => {
    setFinancialForms((prev) => ({
      ...prev,
      [itemId]: { ...getFinancialForm(itemId), ...patch },
    }));
  };

  const handleProcessFinancial = async (item: ExchangeItem) => {
    setError(null);
    const form = getFinancialForm(item.id);
    setProcessingItemId(item.id);
    try {
      await processFinancial.mutateAsync({
        exchangeId: exchange.id,
        dto: {
          itemId: item.id,
          creditDestination: form.creditDestination,
          bankAccountId: form.creditDestination === 'CASH_RETURN' ? form.bankAccountId : undefined,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error al procesar');
    } finally {
      setProcessingItemId(null);
    }
  };

  const formatDiff = (diff: string | null) => {
    if (diff === null) return '—';
    const n = parseFloat(diff);
    if (n === 0) return '$0.00';
    return n > 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-monchito-purple font-bold">{exchange.exchangeNumber}</span>
            <Badge className={STATUS_COLORS[exchange.status]}>
              {STATUS_LABELS[exchange.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info básica */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Cliente:</span>
              <p className="font-medium">{exchange.clientName}</p>
            </div>
            <div>
              <span className="text-gray-500">Creado:</span>
              <p className="font-medium">{new Date(exchange.createdAt).toLocaleDateString('es-CO')}</p>
            </div>
            {exchange.notes && (
              <div className="col-span-2">
                <span className="text-gray-500">Notas:</span>
                <p className="font-medium">{exchange.notes}</p>
              </div>
            )}
          </div>

          {/* Ítems */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Ítems</h3>
            <div className="space-y-2">
              {exchange.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-gray-500">Pedido: {item.originalOrderId.slice(0, 8)}...</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>Original: <span className="font-medium">${parseFloat(item.originalValue).toFixed(2)}</span></p>
                      {item.newValue && (
                        <p>Nuevo: <span className="font-medium">${parseFloat(item.newValue).toFixed(2)}</span></p>
                      )}
                      <p className={`font-semibold ${parseFloat(item.differenceValue ?? '0') > 0 ? 'text-red-600' : parseFloat(item.differenceValue ?? '0') < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        Diferencia: {formatDiff(item.differenceValue)}
                      </p>
                    </div>
                  </div>

                  {/* Procesamiento financiero */}
                  {exchange.status === 'RECEIVED_FROM_SUPPLIER' && !item.financialProcessed && (
                    <div className="border-t pt-2 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Procesar financiero</p>
                      {item.differenceValue !== null && parseFloat(item.differenceValue) < 0 && (
                        <div className="flex gap-2 flex-wrap">
                          <select
                            value={getFinancialForm(item.id).creditDestination}
                            onChange={(e) =>
                              setFinancialForm(item.id, { creditDestination: e.target.value as CreditDestination })
                            }
                            className="border rounded px-2 py-1 text-xs"
                          >
                            <option value="WALLET">Billetera virtual</option>
                            <option value="CASH_RETURN">Devolución en efectivo</option>
                            <option value="DISTRIBUTE">Distribuir a pedidos</option>
                          </select>

                          {getFinancialForm(item.id).creditDestination === 'CASH_RETURN' && (
                            <select
                              value={getFinancialForm(item.id).bankAccountId}
                              onChange={(e) => setFinancialForm(item.id, { bankAccountId: e.target.value })}
                              className="border rounded px-2 py-1 text-xs"
                            >
                              <option value="">Seleccionar cuenta...</option>
                              {bankAccounts.map((ba) => (
                                <option key={ba.id} value={ba.id}>{ba.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleProcessFinancial(item)}
                        disabled={processingItemId === item.id}
                        className="bg-monchito-purple hover:bg-monchito-purple/90 text-white text-xs"
                      >
                        {processingItemId === item.id ? 'Procesando...' : 'Procesar'}
                      </Button>
                    </div>
                  )}

                  {item.financialProcessed && (
                    <div className="border-t pt-2">
                      <Badge className="bg-green-100 text-green-700 text-xs">Procesado financieramente</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Acciones de estado */}
          <div className="flex gap-2 justify-end pt-2 border-t">
            {exchange.status === 'RECEIVED_FROM_CLIENT' && (
              <Button
                onClick={() => handleStatusChange('SENT_TO_SUPPLIER')}
                disabled={updateStatus.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Enviar a proveedor
              </Button>
            )}
            {exchange.status === 'SENT_TO_SUPPLIER' && (
              <Button
                onClick={() => handleStatusChange('RECEIVED_FROM_SUPPLIER')}
                disabled={updateStatus.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Marcar como recibido
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
