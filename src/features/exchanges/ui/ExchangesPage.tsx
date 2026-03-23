import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Badge } from '../../../shared/ui/badge';
import { useExchangeBatches } from '../model/useExchanges';
import type { ExchangeBatchStatus } from '../model/types';

const BATCH_STATUS_LABELS: Record<ExchangeBatchStatus, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  RECEIVED: 'Recibido',
};

const BATCH_STATUS_COLORS: Record<ExchangeBatchStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-green-100 text-green-800',
};

const BATCH_TABS: ExchangeBatchStatus[] = ['SENT', 'RECEIVED'];

export function ExchangesPage() {
  const navigate = useNavigate();
  const [batchTab, setBatchTab] = useState<ExchangeBatchStatus>('SENT');
  const [search, setSearch] = useState('');

  const { data: batches = [], isLoading } = useExchangeBatches({ status: batchTab });

  const filtered = batches.filter(
    (b) =>
      b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      (b.trackingGuide || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-monchito-purple">Cambios de Pedidos</h1>
        <Button
          onClick={() => navigate('/exchanges/new')}
          className="bg-monchito-purple hover:bg-monchito-purple/90 text-white"
        >
          + Nuevo lote de cambios
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Buscar por número de lote o guía..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {BATCH_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setBatchTab(tab)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                batchTab === tab
                  ? 'border-monchito-purple text-monchito-purple'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {BATCH_STATUS_LABELS[tab]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500 py-8 text-center">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No hay lotes en este estado</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10">
                  <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N° Lote</th>
                  <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Guía</th>
                  <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Pedidos</th>
                  <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Estado</th>
                  <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Creado por</th>
                  <th className="px-3 py-3 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-monchito-purple/5 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <td className="px-3 py-2 border-r border-slate-50 font-mono font-bold text-monchito-purple">
                      {batch.batchNumber}
                    </td>
                    <td className="px-3 py-2 border-r border-slate-50 font-mono text-slate-500">
                      {batch.trackingGuide || '—'}
                    </td>
                    <td className="px-3 py-2 border-r border-slate-50 text-slate-600">
                      {batch.items.length} pedido{batch.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 py-2 border-r border-slate-50">
                      <Badge className={BATCH_STATUS_COLORS[batch.status as ExchangeBatchStatus]}>
                        {BATCH_STATUS_LABELS[batch.status as ExchangeBatchStatus]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 border-r border-slate-50 text-slate-500">
                      {batch.createdByName || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {new Date(batch.createdAt).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
