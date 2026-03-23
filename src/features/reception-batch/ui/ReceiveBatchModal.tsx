import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { useReceiveExchangeBatch } from '@/features/exchanges/model/useExchanges';
import { useBankAccountList } from '@/features/bank-accounts/api/hooks';
import type { ExchangeBatch, CreditDestination, ReceiveBatchItemDTO } from '@/features/exchanges/model/types';

interface ItemState {
  newInvoiceValue: string;
  creditDestination: CreditDestination;
  bankAccountId: string;
}

interface Props {
  batch: ExchangeBatch;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceiveBatchModal({ batch, open, onClose, onSuccess }: Props) {
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      batch.items.map((item) => [
        item.id,
        { newInvoiceValue: '', creditDestination: 'WALLET', bankAccountId: '' },
      ])
    )
  );
  const [error, setError] = useState<string | null>(null);

  const receiveBatch = useReceiveExchangeBatch();
  const { data: bankAccountsData } = useBankAccountList({ limit: 100 });
  const bankAccounts = bankAccountsData?.data ?? [];

  const getState = (itemId: string): ItemState =>
    itemStates[itemId] ?? { newInvoiceValue: '', creditDestination: 'WALLET', bankAccountId: '' };

  const setState = (itemId: string, patch: Partial<ItemState>) =>
    setItemStates((prev) => ({ ...prev, [itemId]: { ...getState(itemId), ...patch } }));

  const getDiff = (itemId: string, orderTotal: string): number | null => {
    const s = getState(itemId);
    const val = parseFloat(s.newInvoiceValue);
    if (isNaN(val)) return null;
    return val - parseFloat(orderTotal);
  };

  const isValid = batch.items.every((item) => {
    const s = getState(item.id);
    const val = parseFloat(s.newInvoiceValue);
    if (isNaN(val) || s.newInvoiceValue === '') return false;
    const diff = val - parseFloat(item.orderTotal);
    if (diff < 0 && !s.creditDestination) return false;
    if (diff < 0 && s.creditDestination === 'CASH_RETURN' && !s.bankAccountId) return false;
    return true;
  });

  const handleConfirm = async () => {
    setError(null);
    const items: ReceiveBatchItemDTO[] = batch.items.map((item) => {
      const s = getState(item.id);
      const diff = getDiff(item.id, item.orderTotal)!;
      return {
        batchItemId: item.id,
        orderId: item.orderId,
        newInvoiceValue: parseFloat(s.newInvoiceValue),
        creditDestination: diff < 0 ? s.creditDestination : undefined,
        bankAccountId:
          diff < 0 && s.creditDestination === 'CASH_RETURN' ? s.bankAccountId : undefined,
      };
    });

    try {
      await receiveBatch.mutateAsync({ batchId: batch.id, dto: { items } });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al recibir el lote');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-monchito-purple font-bold">
            Recibir Lote {batch.batchNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Ingresa el valor de factura recibido para cada pedido. Solo se registrará la diferencia
            respecto al valor original ya pagado.
          </p>

          <div className="space-y-3">
            {batch.items.map((item) => {
              const s = getState(item.id);
              const diff = getDiff(item.id, item.orderTotal);
              const orderTotal = parseFloat(item.orderTotal);

              return (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white"
                >
                  {/* Item header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{item.clientName}</p>
                      <p className="text-xs text-slate-500 font-mono">{item.receiptNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Valor original</p>
                      <p className="text-sm font-bold text-slate-700">${orderTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* New invoice value input */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">
                        Nuevo valor de factura
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={s.newInvoiceValue}
                        onChange={(e) => setState(item.id, { newInvoiceValue: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Difference badge */}
                    <div className="pt-5">
                      {diff === null ? (
                        <Badge className="bg-slate-100 text-slate-400 text-xs">—</Badge>
                      ) : diff > 0 ? (
                        <Badge className="bg-red-100 text-red-700 text-xs font-semibold">
                          Cobrar adicional: ${diff.toFixed(2)}
                        </Badge>
                      ) : diff < 0 ? (
                        <Badge className="bg-green-100 text-green-700 text-xs font-semibold">
                          Saldo a favor: ${Math.abs(diff).toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 text-xs">Sin diferencia</Badge>
                      )}
                    </div>
                  </div>

                  {/* Credit destination selector (only when diff < 0) */}
                  {diff !== null && diff < 0 && (
                    <div className="space-y-2 pt-1">
                      <label className="text-xs text-slate-500">Destino del saldo a favor</label>
                      <div className="flex gap-2 flex-wrap">
                        {(['WALLET', 'CASH_RETURN', 'DISTRIBUTE'] as CreditDestination[]).map(
                          (opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setState(item.id, { creditDestination: opt })}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                s.creditDestination === opt
                                  ? 'bg-monchito-purple text-white border-monchito-purple'
                                  : 'bg-white text-slate-600 border-slate-300 hover:border-monchito-purple/50'
                              }`}
                            >
                              {opt === 'WALLET'
                                ? 'Billetera virtual'
                                : opt === 'CASH_RETURN'
                                ? 'Devolución efectivo'
                                : 'Distribuir a pedidos'}
                            </button>
                          )
                        )}
                      </div>

                      {/* Bank account selector for CASH_RETURN */}
                      {s.creditDestination === 'CASH_RETURN' && (
                        <select
                          value={s.bankAccountId}
                          onChange={(e) => setState(item.id, { bankAccountId: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-monchito-purple/30"
                        >
                          <option value="">Seleccionar cuenta bancaria...</option>
                          {bankAccounts
                            .filter((ba) => ba.isActive)
                            .map((ba) => (
                              <option key={ba.id} value={ba.id}>
                                {ba.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={onClose} disabled={receiveBatch.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid || receiveBatch.isPending}
              className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold"
            >
              {receiveBatch.isPending ? 'Procesando...' : 'Confirmar Recepción'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
