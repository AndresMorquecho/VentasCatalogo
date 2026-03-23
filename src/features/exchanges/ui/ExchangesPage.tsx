import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/ui/tabs';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Badge } from '../../../shared/ui/badge';
import { useExchanges, useExchangeBatches, useUpdateExchangeBatchStatus } from '../model/useExchanges';
import { ExchangeDetailModal } from './ExchangeDetailModal';
import { ExchangeGuide } from './ExchangeGuide';
import type { Exchange, ExchangeStatus, ExchangeBatch, ExchangeBatchStatus } from '../model/types';

// ── OrderExchange labels ─────────────────────────────────────────────────────
const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
  RECEIVED_FROM_CLIENT: 'Pendientes',
  SENT_TO_SUPPLIER: 'Enviados',
  RECEIVED_FROM_SUPPLIER: 'Recibidos',
};
const EXCHANGE_STATUS_COLORS: Record<ExchangeStatus, string> = {
  RECEIVED_FROM_CLIENT: 'bg-yellow-100 text-yellow-800',
  SENT_TO_SUPPLIER: 'bg-blue-100 text-blue-800',
  RECEIVED_FROM_SUPPLIER: 'bg-green-100 text-green-800',
};
const EXCHANGE_TABS: ExchangeStatus[] = ['RECEIVED_FROM_CLIENT', 'SENT_TO_SUPPLIER', 'RECEIVED_FROM_SUPPLIER'];

// ── ExchangeBatch labels ─────────────────────────────────────────────────────
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
const BATCH_NEXT_STATUS: Partial<Record<ExchangeBatchStatus, ExchangeBatchStatus>> = {
  PENDING: 'SENT',
  SENT: 'RECEIVED',
};
const BATCH_NEXT_LABEL: Partial<Record<ExchangeBatchStatus, string>> = {
  PENDING: 'Marcar Enviado',
  SENT: 'Marcar Recibido',
};
const BATCH_TABS: ExchangeBatchStatus[] = ['PENDING', 'SENT', 'RECEIVED'];

// ── Main page ────────────────────────────────────────────────────────────────
export function ExchangesPage() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<'batches' | 'exchanges'>('batches');

  // Batches state
  const [batchTab, setBatchTab] = useState<ExchangeBatchStatus>('PENDING');
  const [batchSearch, setBatchSearch] = useState('');
  const { data: batches = [], isLoading: batchesLoading } = useExchangeBatches({ status: batchTab });
  const updateBatchStatus = useUpdateExchangeBatchStatus();

  // Exchanges state
  const [exchangeTab, setExchangeTab] = useState<ExchangeStatus>('RECEIVED_FROM_CLIENT');
  const [exchangeSearch, setExchangeSearch] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const { data: exchanges = [], isLoading: exchangesLoading } = useExchanges({ status: exchangeTab });

  // Filtered batches
  const filteredBatches = batches.filter((b) =>
    b.batchNumber.toLowerCase().includes(batchSearch.toLowerCase()) ||
    (b.trackingGuide || '').toLowerCase().includes(batchSearch.toLowerCase())
  );

  // Filtered exchanges
  const filteredExchanges = exchanges.filter(
    (ex) =>
      ex.exchangeNumber.toLowerCase().includes(exchangeSearch.toLowerCase()) ||
      ex.clientName.toLowerCase().includes(exchangeSearch.toLowerCase())
  );

  const totalDiff = (ex: Exchange) =>
    ex.items.reduce((sum, it) => sum + (it.differenceValue ? parseFloat(it.differenceValue) : 0), 0);

  const handleAdvanceBatch = (batch: ExchangeBatch) => {
    const next = BATCH_NEXT_STATUS[batch.status];
    if (!next) return;
    updateBatchStatus.mutate({ id: batch.id, newStatus: next });
  };

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

      {/* Main tabs: Lotes vs Cambios individuales */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => setMainTab('batches')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'batches'
              ? 'border-monchito-purple text-monchito-purple'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Lotes de Cambio
        </button>
        <button
          onClick={() => setMainTab('exchanges')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'exchanges'
              ? 'border-monchito-purple text-monchito-purple'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Cambios Individuales
        </button>
      </div>

      {/* ── LOTES DE CAMBIO ── */}
      {mainTab === 'batches' && (
        <div className="space-y-3">
          <Input
            placeholder="Buscar por número de lote o guía..."
            value={batchSearch}
            onChange={(e) => setBatchSearch(e.target.value)}
            className="max-w-xs"
          />
          <Tabs value={batchTab} onValueChange={(v) => setBatchTab(v as ExchangeBatchStatus)}>
            <TabsList>
              {BATCH_TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {BATCH_STATUS_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
            {BATCH_TABS.map((tab) => (
              <TabsContent key={tab} value={tab}>
                {batchesLoading ? (
                  <p className="text-sm text-gray-500 py-8 text-center">Cargando...</p>
                ) : filteredBatches.length === 0 ? (
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
                          <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Fecha</th>
                          <th className="px-3 py-3 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredBatches.map((batch) => (
                          <tr key={batch.id} className="hover:bg-monchito-purple/5 transition-colors border-b border-slate-50 last:border-0">
                            <td className="px-3 py-2 border-r border-slate-50 font-mono font-bold text-monchito-purple">{batch.batchNumber}</td>
                            <td className="px-3 py-2 border-r border-slate-50 font-mono text-slate-500">{batch.trackingGuide || '—'}</td>
                            <td className="px-3 py-2 border-r border-slate-50 text-slate-600">{batch.items.length} pedido{batch.items.length !== 1 ? 's' : ''}</td>
                            <td className="px-3 py-2 border-r border-slate-50">
                              <Badge className={BATCH_STATUS_COLORS[batch.status as ExchangeBatchStatus]}>
                                {BATCH_STATUS_LABELS[batch.status as ExchangeBatchStatus]}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 border-r border-slate-50 text-slate-500">{batch.createdByName || '—'}</td>
                            <td className="px-3 py-2 border-r border-slate-50 text-slate-500">
                              {new Date(batch.createdAt).toLocaleDateString('es-CO')}
                            </td>
                            <td className="px-3 py-2">
                              {BATCH_NEXT_STATUS[batch.status as ExchangeBatchStatus] && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updateBatchStatus.isPending}
                                  onClick={() => handleAdvanceBatch(batch)}
                                  className="h-7 px-3 text-xs border-monchito-purple/30 text-monchito-purple hover:bg-monchito-purple/5 font-semibold"
                                >
                                  {BATCH_NEXT_LABEL[batch.status as ExchangeBatchStatus]}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {/* ── CAMBIOS INDIVIDUALES ── */}
      {mainTab === 'exchanges' && (
        <div className="space-y-3">
          <Input
            placeholder="Buscar por número o cliente..."
            value={exchangeSearch}
            onChange={(e) => setExchangeSearch(e.target.value)}
            className="max-w-xs"
          />
          <Tabs value={exchangeTab} onValueChange={(v) => setExchangeTab(v as ExchangeStatus)}>
            <TabsList>
              {EXCHANGE_TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {EXCHANGE_STATUS_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
            {EXCHANGE_TABS.map((tab) => (
              <TabsContent key={tab} value={tab}>
                {exchangesLoading ? (
                  <p className="text-sm text-gray-500 py-8 text-center">Cargando...</p>
                ) : filteredExchanges.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">No hay cambios en este estado</p>
                ) : (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10">
                          <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Número</th>
                          <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Cliente</th>
                          <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Pedidos</th>
                          <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Diferencia</th>
                          <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Estado</th>
                          <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Fecha</th>
                          <th className="px-3 py-3 text-[10px] font-black text-monchito-purple uppercase tracking-widest" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredExchanges.map((ex) => {
                          const diff = totalDiff(ex);
                          return (
                            <tr
                              key={ex.id}
                              className="hover:bg-monchito-purple/5 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                              onClick={() => setSelectedExchange(ex)}
                            >
                              <td className="px-3 py-2 border-r border-slate-50 font-mono font-bold text-monchito-purple">{ex.exchangeNumber}</td>
                              <td className="px-3 py-2 border-r border-slate-50 font-semibold text-slate-800">{ex.clientName}</td>
                              <td className="px-3 py-2 border-r border-slate-50 text-slate-500">{ex.items.length} ítem(s)</td>
                              <td className="px-3 py-2 border-r border-slate-50">
                                <span className={diff > 0 ? 'text-red-600 font-medium' : diff < 0 ? 'text-green-600 font-medium' : 'text-slate-400'}>
                                  {diff === 0 ? '—' : diff > 0 ? `+${diff.toFixed(2)}` : `-${Math.abs(diff).toFixed(2)}`}
                                </span>
                              </td>
                              <td className="px-3 py-2 border-r border-slate-50">
                                <Badge className={EXCHANGE_STATUS_COLORS[ex.status as ExchangeStatus]}>
                                  {EXCHANGE_STATUS_LABELS[ex.status as ExchangeStatus]}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 border-r border-slate-50 text-slate-500">
                                {new Date(ex.createdAt).toLocaleDateString('es-CO')}
                              </td>
                              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <ExchangeGuide exchange={ex} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {selectedExchange && (
        <ExchangeDetailModal
          exchange={selectedExchange}
          open={!!selectedExchange}
          onClose={() => setSelectedExchange(null)}
        />
      )}
    </div>
  );
}
