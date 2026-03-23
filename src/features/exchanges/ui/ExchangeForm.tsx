import { useState } from 'react';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { useCreateExchange, useAddExchangeItem } from '../model/useExchanges';
import type { Exchange } from '../model/types';

interface Props {
  clientId: string;
  clientName: string;
  deliveredOrders: { id: string; receiptNumber: string; total: string }[];
  onSuccess?: (exchange: Exchange) => void;
  onCancel?: () => void;
}

interface ItemForm {
  originalOrderId: string;
  productName: string;
  originalValue: string;
  newValue: string;
}

const emptyItem = (): ItemForm => ({
  originalOrderId: '',
  productName: '',
  originalValue: '',
  newValue: '',
});

export function ExchangeForm({ clientId, clientName, deliveredOrders, onSuccess, onCancel }: Props) {
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [error, setError] = useState<string | null>(null);

  const createExchange = useCreateExchange();
  const addItem = useAddExchangeItem();

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItemRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((it) => it.originalOrderId && it.productName && it.originalValue);
    if (validItems.length === 0) {
      setError('Agrega al menos un ítem válido');
      return;
    }

    try {
      const exchange = await createExchange.mutateAsync({ clientId, clientName, notes: notes || undefined });

      for (const it of validItems) {
        await addItem.mutateAsync({
          exchangeId: exchange.id,
          dto: {
            originalOrderId: it.originalOrderId,
            productName: it.productName,
            originalValue: parseFloat(it.originalValue),
            newValue: it.newValue ? parseFloat(it.newValue) : null,
          },
        });
      }

      onSuccess?.(exchange);
    } catch (err: any) {
      setError(err.message || 'Error al crear el cambio');
    }
  };

  const isLoading = createExchange.isPending || addItem.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Cliente</Label>
        <p className="text-sm font-medium text-monchito-purple">{clientName}</p>
      </div>

      <div>
        <Label htmlFor="notes">Notas (opcional)</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder="Motivo del cambio..."
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Ítems del cambio</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
            + Agregar ítem
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">Ítem {index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              )}
            </div>

            <div>
              <Label htmlFor={`order-${index}`}>Pedido original</Label>
              <select
                id={`order-${index}`}
                value={item.originalOrderId}
                onChange={(e) => updateItem(index, 'originalOrderId', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                required
              >
                <option value="">Seleccionar pedido...</option>
                {deliveredOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.receiptNumber} — ${o.total}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor={`product-${index}`}>Nombre del producto</Label>
              <Input
                id={`product-${index}`}
                value={item.productName}
                onChange={(e) => updateItem(index, 'productName', e.target.value)}
                placeholder="Ej: Blusa talla M"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`orig-${index}`}>Valor original ($)</Label>
                <Input
                  id={`orig-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.originalValue}
                  onChange={(e) => updateItem(index, 'originalValue', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`new-${index}`}>Nuevo valor ($) <span className="text-gray-400">(opcional)</span></Label>
                <Input
                  id={`new-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.newValue}
                  onChange={(e) => updateItem(index, 'newValue', e.target.value)}
                  placeholder="Dejar vacío si es igual"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-monchito-purple hover:bg-monchito-purple/90 text-white"
        >
          {isLoading ? 'Creando...' : 'Crear cambio'}
        </Button>
      </div>
    </form>
  );
}
