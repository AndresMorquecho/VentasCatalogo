import { useState } from 'react';
import { Plus, Trash2, LayoutList, MessageSquare } from 'lucide-react';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Badge } from '../../../shared/ui/badge';
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
  tempId?: string;
}

const emptyItem = (): ItemForm => ({
  originalOrderId: '',
  productName: '',
  originalValue: '',
  newValue: '',
  tempId: Math.random().toString(36).substr(2, 9),
});

export function ExchangeForm({ clientId, clientName, deliveredOrders, onSuccess, onCancel }: Props) {
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Current item being added via entry bar
  const [currentItem, setCurrentItem] = useState<ItemForm>(emptyItem());

  const createExchange = useCreateExchange();
  const addItem = useAddExchangeItem();

  const handleAddItem = () => {
    if (!currentItem.originalOrderId || !currentItem.productName || !currentItem.originalValue) {
      setError('Completa los campos obligatorios del ítem');
      return;
    }
    setItems((prev) => [...prev, currentItem]);
    setCurrentItem(emptyItem());
    setError(null);
  };

  const updateItemInTable = (index: number, field: keyof ItemForm, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Agrega al menos un ítem al cambio');
      return;
    }

    try {
      const exchange = await createExchange.mutateAsync({ clientId, clientName, notes: notes || undefined });

      for (const it of items) {
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
    <div className="space-y-6">
      {/* Notes Section */}
      <Card className="shadow-sm border-slate-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-2 px-4 bg-monchito-purple/5 border-b border-monchito-purple/10">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-monchito-purple flex items-center gap-2">
            <MessageSquare className="h-3 w-3" /> Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs font-bold text-slate-600">Notas u Observaciones (opcional):</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe el motivo del cambio o detalles relevantes..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple outline-none transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Entry Bar & Items Table */}
      <Card className="shadow-sm border-slate-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-2 px-4 bg-monchito-purple/5 border-b border-monchito-purple/10 flex flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-monchito-purple flex items-center gap-2">
            <LayoutList className="h-3 w-3" /> Ítems del Cambio
          </CardTitle>
          <Badge variant="outline" className="text-[9px] font-black border-monchito-purple/20 text-monchito-purple bg-monchito-purple/5 uppercase tracking-tighter">
            {items.length} {items.length === 1 ? 'Ítem' : 'Ítems'}
          </Badge>
        </CardHeader>

        {/* Entry Bar */}
        <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap lg:flex-nowrap gap-3 items-end">
          <div className="w-full lg:w-[250px] space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pedido Original</Label>
            <select
              value={currentItem.originalOrderId}
              onChange={(e) => {
                const order = deliveredOrders.find(o => o.id === e.target.value);
                setCurrentItem({ 
                  ...currentItem, 
                  originalOrderId: e.target.value,
                  originalValue: order ? order.total : '' 
                });
              }}
              className="h-9 w-full rounded-xl border border-slate-200 text-xs px-3 py-1 bg-white focus:ring-2 focus:ring-monchito-purple/20 outline-none"
            >
              <option value="">Seleccionar pedido...</option>
              {deliveredOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.receiptNumber} — ${o.total}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px] space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Producto</Label>
            <Input
              placeholder="Nombre del producto a cambiar"
              className="h-9 rounded-xl border-slate-200 text-xs px-3"
              value={currentItem.productName}
              onChange={(e) => setCurrentItem({ ...currentItem, productName: e.target.value })}
            />
          </div>

          <div className="w-full sm:w-[100px] space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Orig.</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
              <Input
                type="number"
                step="0.01"
                className="h-9 rounded-xl border-slate-200 text-xs pl-6 pr-2"
                value={currentItem.originalValue}
                onChange={(e) => setCurrentItem({ ...currentItem, originalValue: e.target.value })}
              />
            </div>
          </div>

          <div className="w-full sm:w-[100px] space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nuevo Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
              <Input
                type="number"
                step="0.01"
                placeholder="Igual"
                className="h-9 rounded-xl border-slate-200 text-xs pl-6 pr-2"
                value={currentItem.newValue}
                onChange={(e) => setCurrentItem({ ...currentItem, newValue: e.target.value })}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddItem}
            className="h-9 px-4 bg-monchito-purple hover:bg-monchito-purple/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Agregar
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-12 text-center">N°</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Pedido</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Producto</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Valor Orig.</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Nuevo Valor</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Diferencia</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                    No has agregado ítems al cambio todavía.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const origVal = parseFloat(item.originalValue) || 0;
                  const newVal = item.newValue ? parseFloat(item.newValue) : origVal;
                  const diff = newVal - origVal;
                  const order = deliveredOrders.find(o => o.id === item.originalOrderId);

                  return (
                    <tr key={item.tempId || idx} className="hover:bg-monchito-purple/5 transition-all">
                      <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-monchito-purple">{order?.receiptNumber || '---'}</td>
                      <td className="px-4 py-3">
                        <Input
                          value={item.productName}
                          onChange={(e) => updateItemInTable(idx, 'productName', e.target.value)}
                          className="h-7 text-xs border-transparent hover:border-slate-200 bg-transparent focus:bg-white focus:border-monchito-purple px-1"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-600">${origVal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <span className="text-slate-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.newValue}
                            onChange={(e) => updateItemInTable(idx, 'newValue', e.target.value)}
                            placeholder={item.originalValue}
                            className="h-7 w-16 text-right text-xs font-bold border border-transparent hover:border-slate-200 bg-transparent focus:bg-white focus:border-monchito-purple rounded-lg px-1 outline-none"
                          />
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-400'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                          className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-shake">
          {error}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-8">
        <div className="hidden sm:block">
          {items.length > 0 && (
             <p className="text-xs text-slate-500 font-medium">
               Resumen: <span className="text-slate-900 font-black">{items.length} productos</span> a procesar.
             </p>
          )}
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onCancel} 
              disabled={isLoading}
              className="font-bold text-slate-400 hover:text-slate-600 px-6 rounded-xl"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || items.length === 0}
            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black px-8 rounded-xl shadow-lg shadow-monchito-purple/20 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </span>
            ) : (
              'Crear Orden de Cambio'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
