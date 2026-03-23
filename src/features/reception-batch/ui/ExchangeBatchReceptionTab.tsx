import { useState } from 'react';
import { PackageSearch, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useExchangeBatches } from '@/features/exchanges/model/useExchanges';
import { ReceiveBatchModal } from './ReceiveBatchModal';
import type { ExchangeBatch, ExchangeBatchItem } from '@/features/exchanges/model/types';

export function ExchangeBatchReceptionTab() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedBatch, setSelectedBatch] = useState<ExchangeBatch | null>(null);

  // Only show SENT batches — those are ready to be received in warehouse
  const { data: batches = [], isLoading } = useExchangeBatches({ status: 'SENT' });

  const filtered = batches.filter(
    (b) =>
      b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      (b.trackingGuide || '').toLowerCase().includes(search.toLowerCase()) ||
      b.items.some((i) => i.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <p className="text-sm text-slate-400 py-12 text-center">Cargando lotes de cambio...</p>;
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <PackageSearch className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No hay lotes de cambio enviados pendientes de recepción</p>
        <p className="text-xs mt-1">Los lotes aparecen aquí cuando están en estado "Enviado"</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar por N° lote, guía o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs h-8 text-sm"
          />
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} lote{filtered.length !== 1 ? 's' : ''} pendiente{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          {filtered.map((batch, idx) => {
            const isOpen = expanded.has(batch.id);
            const totalPending = batch.items.reduce((s, i) => s + Number(i.pendingAmount), 0);
            const totalOrder = batch.items.reduce((s, i) => s + Number(i.orderTotal), 0);

            return (
              <div key={batch.id} className={idx > 0 ? 'border-t border-slate-100' : ''}>
                {/* Batch header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-monchito-purple/5 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(batch.id)}
                >
                  <button className="text-slate-400 shrink-0">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-0.5 min-w-0">
                    <div>
                      <p className="font-mono font-bold text-monchito-purple text-sm">{batch.batchNumber}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(batch.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Guía</p>
                      <p className="text-xs font-mono font-semibold text-slate-700">{batch.trackingGuide || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pedidos</p>
                      <p className="text-xs font-bold text-slate-800">{batch.items.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total pedidos</p>
                      <p className="text-xs font-bold text-slate-800">${totalOrder.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Saldo pendiente</p>
                      <p className={`text-xs font-bold ${totalPending > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        ${totalPending.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge className="bg-blue-100 text-blue-800 text-[10px]">Enviado</Badge>
                    <Button
                      size="sm"
                      onClick={() => setSelectedBatch(batch)}
                      className="h-7 px-3 text-xs bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold"
                    >
                      Recibir en Bodega <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Expanded items */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-6 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                          <th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">N° Recibo</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Pedido</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Factura</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Abonado</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.items.map((item: ExchangeBatchItem) => (
                          <tr key={item.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-6 py-2 font-semibold text-slate-800">{item.clientName}</td>
                            <td className="px-3 py-2 font-mono text-monchito-purple font-bold">{item.receiptNumber}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">${Number(item.orderTotal).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-slate-400">{item.invoiceTotal ? `${Number(item.invoiceTotal).toFixed(2)}` : '—'}</td>
                            <td className="px-3 py-2 text-right font-semibold text-green-700">${Number(item.paidAmount).toFixed(2)}</td>
                            <td className={`px-3 py-2 text-right font-bold ${Number(item.pendingAmount) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              ${Number(item.pendingAmount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedBatch && (
        <ReceiveBatchModal
          batch={selectedBatch}
          open={!!selectedBatch}
          onClose={() => setSelectedBatch(null)}
          onSuccess={() => setSelectedBatch(null)}
        />
      )}
    </>
  );
}
