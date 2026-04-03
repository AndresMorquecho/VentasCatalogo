// v3-redesign
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, PackageSearch, Search, X, Plus, Check } from 'lucide-react';

import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Card, CardContent } from '../../../shared/ui/card';
import { Badge } from '../../../shared/ui/badge';
import { PageHeader } from '../../../shared/ui/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../shared/ui/dialog';

import { orderApi } from '../../../entities/order/model/api';
import { exchangesApi } from '../lib/exchangesApi';
import type { Order } from '../../../entities/order/model/types';

interface BatchRow { order: Order }

function calcPaid(order: Order): number {
  const hasSplit = order.payments.some((p) => p.method === 'SPLIT_PAYMENT');
  return order.payments
    .filter((p) => !(hasSplit && p.method === 'CREDITO_CLIENTE'))
    .reduce((sum, p) => sum + Number(p.amount), 0);
}

interface AddOrdersModalProps {
  open: boolean;
  onClose: () => void;
  alreadyAdded: string[];
  onConfirm: (orders: Order[]) => void;
}

function AddOrdersModal({ open, onClose, alreadyAdded, onConfirm }: AddOrdersModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Order[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedMap, setSelectedMap] = useState<Map<string, Order>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setSelected(new Set()); setSelectedMap(new Map()); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await orderApi.getAll({ search: query, status: 'ENTREGADO', limit: 20 });
        setResults(res?.data ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [query]);

  const toggle = (order: Order) => {
    if (alreadyAdded.includes(order.id)) return;
    setSelected((prev) => { const n = new Set(prev); n.has(order.id) ? n.delete(order.id) : n.add(order.id); return n; });
    setSelectedMap((prev) => { const n = new Map(prev); n.has(order.id) ? n.delete(order.id) : n.set(order.id, order); return n; });
  };

  const handleConfirm = () => { onConfirm(Array.from(selectedMap.values())); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 bg-monchito-purple/5 border-b border-monchito-purple/10">
          <DialogTitle className="text-base font-black text-monchito-purple flex items-center gap-2">
            <PackageSearch className="h-5 w-5" /> Agregar pedidos al lote
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pt-4 pb-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              autoFocus
              placeholder="Buscar por nombre de cliente, N de recibo, N de pedido..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Buscando...</span>
            )}
          </div>
        </div>
        <div className="overflow-y-auto" style={{ minHeight: 220, maxHeight: 380 }}>
          {results.length === 0 && !searching && (
            <div className="py-14 text-center text-sm text-slate-400">
              {query.trim() ? 'No se encontraron pedidos entregados' : 'Escribe para buscar pedidos entregados'}
            </div>
          )}
          {results.map((order) => {
            const isAdded = alreadyAdded.includes(order.id);
            const isSel = selected.has(order.id);
            const paid = calcPaid(order);
            const pending = Math.max(0, Number(order.total) - paid);
            return (
              <div
                key={order.id}
                onClick={() => toggle(order)}
                className={`flex items-center gap-3 px-6 py-3 border-b border-slate-100 transition-colors
                  ${isAdded ? 'opacity-50 cursor-not-allowed bg-slate-50' : isSel ? 'bg-monchito-purple/5 cursor-pointer' : 'hover:bg-slate-50 cursor-pointer'}`}
              >
                <div className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
                  ${isAdded ? 'border-slate-300 bg-slate-200' : isSel ? 'border-monchito-purple bg-monchito-purple' : 'border-slate-300 bg-white'}`}>
                  {(isSel || isAdded) && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-0.5">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 truncate">{order.clientName}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {order.receiptNumber}{order.orderNumber ? ` - ${order.orderNumber}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-100 text-slate-600 text-[10px] px-1.5 shrink-0">{order.brandName}</Badge>
                    {isAdded && <span className="text-[10px] text-slate-400 font-medium">Ya agregado</span>}
                  </div>
                  <div className="text-xs text-right space-y-0.5">
                    <div>Total: <span className="font-semibold text-slate-800">${Number(order.total).toFixed(2)}</span></div>
                    <div>
                      Abono: <span className="font-semibold text-green-700">${paid.toFixed(2)}</span>
                      {' - '}Saldo: <span className={`font-bold ${pending > 0 ? 'text-red-600' : 'text-slate-400'}`}>${pending.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="px-6 py-4 border-t border-slate-100 flex flex-row items-center justify-between gap-3">
          <span className="text-sm text-slate-500">
            {selected.size > 0
              ? <><span className="font-bold text-monchito-purple">{selected.size}</span> pedido{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}</>
              : 'Ninguno seleccionado'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="h-9">Cancelar</Button>
            <Button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="h-9 bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold"
            >
              Agregar {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewExchangeBatchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [trackingGuide, setTrackingGuide] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOrders = (orders: Order[]) => {
    setRows((prev) => {
      const ids = new Set(prev.map((r) => r.order.id));
      return [...prev, ...orders.filter((o) => !ids.has(o.id)).map((o) => ({ order: o }))];
    });
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.order.id !== id));

  const totalOrders = rows.reduce((s, r) => s + Number(r.order.total), 0);
  const totalPaid   = rows.reduce((s, r) => s + calcPaid(r.order), 0);
  const totalPending = rows.reduce((s, r) => s + Math.max(0, Number(r.order.total) - calcPaid(r.order)), 0);

  const handleSubmit = async () => {
    if (rows.length === 0) { setError('Agrega al menos un pedido al lote'); return; }
    setError(null);
    setSubmitting(true);
    try {
      await exchangesApi.createBatch({
        trackingGuide: trackingGuide.trim() || undefined,
        notes: batchNotes.trim() || undefined,
        items: rows.map((r) => ({ orderId: r.order.id })),
      });
      // Invalidate cache so ReceptionBatchPage picks up the new SENT batch immediately
      await queryClient.invalidateQueries({ queryKey: ['exchange-batches'] });
      navigate('/exchanges');
    } catch (err: any) {
      setError(err.message || 'Error al crear el lote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      <PageHeader
        title="Nuevo Lote de Cambios"
        description="Agrega pedidos entregados y agrúpalos en un lote para enviar al proveedor"
        icon={PackageSearch}
        actions={
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/exchanges')}
            className="text-monchito-purple hover:bg-monchito-purple/10 rounded-lg font-bold text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Cambios
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
          <CardContent className="p-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pedidos</span>
            <span className="text-2xl font-black text-slate-900">{rows.length}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
          <CardContent className="p-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
            <span className="text-2xl font-black text-slate-900">${totalOrders.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
          <CardContent className="p-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abonado</span>
            <span className="text-2xl font-black text-green-600">${totalPaid.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
          <CardContent className="p-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo Total</span>
            <span className={`text-2xl font-black ${totalPending > 0 ? 'text-red-600' : 'text-slate-900'}`}>${totalPending.toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 w-48">
              <Label className="text-xs font-bold text-slate-600">N de Guia <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input placeholder="Ej: GU-2024-001" value={trackingGuide} onChange={(e) => setTrackingGuide(e.target.value)} className="h-8 text-sm font-mono" />
            </div>
            <div className="space-y-1 flex-1 min-w-[180px]">
              <Label className="text-xs font-bold text-slate-600">Notas <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input placeholder="Observaciones del lote..." value={batchNotes} onChange={(e) => setBatchNotes(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex gap-2 pb-0.5">
              <Button variant="outline" onClick={() => navigate('/exchanges')} disabled={submitting} className="h-8 text-sm">Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting || rows.length === 0} className="h-8 bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold text-sm">
                {submitting ? 'Creando...' : `Crear lote (${rows.length})`}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 font-medium mt-2">{error}</p>}
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center justify-between px-4 py-2 bg-monchito-purple/5 border-b border-monchito-purple/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-monchito-purple">Pedidos en el Lote</span>
          <div className="flex items-center gap-3">
            {rows.length > 0 && <span className="text-xs font-semibold text-slate-500">{rows.length} pedido{rows.length !== 1 ? 's' : ''}</span>}
            <Button size="sm" onClick={() => setModalOpen(true)} className="h-7 px-3 text-xs bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold rounded-lg">
              <Plus className="h-3.5 w-3.5 mr-1" /> Agregar pedido
            </Button>
          </div>
        </div>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10">
              <th className="px-2 py-3 border-r border-monchito-purple/10 text-center w-8 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N</th>
              <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Cliente</th>
              <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N Recibo</th>
              <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N Pedido</th>
              <th className="px-3 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Marca</th>
              <th className="px-3 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Valor Pedido</th>
              <th className="px-3 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Valor Factura</th>
              <th className="px-3 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Abono</th>
              <th className="px-3 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Saldo</th>
              <th className="px-3 py-3 text-center w-12 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Quitar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <PackageSearch className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Aun no hay pedidos en el lote</p>
                    <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="mt-1 border-monchito-purple/30 text-monchito-purple hover:bg-monchito-purple/5 font-semibold">
                      <Plus className="h-4 w-4 mr-1" /> Agregar pedido
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map(({ order }, idx) => {
                const paid = calcPaid(order);
                const pending = Math.max(0, Number(order.total) - paid);
                return (
                  <tr key={order.id} className="hover:bg-monchito-purple/5 transition-all duration-200 border-b border-slate-50 last:border-0">
                    <td className="px-2 py-2 border-r border-slate-50 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 border-r border-slate-50 font-semibold text-slate-800">{order.clientName}</td>
                    <td className="px-3 py-2 border-r border-slate-50 font-mono text-monchito-purple font-bold">{order.receiptNumber}</td>
                    <td className="px-3 py-2 border-r border-slate-50 font-mono text-slate-500">{order.orderNumber || '-'}</td>
                    <td className="px-3 py-2 border-r border-slate-50"><Badge className="bg-slate-100 text-slate-600 text-[10px] px-1.5">{order.brandName}</Badge></td>
                    <td className="px-3 py-2 border-r border-slate-50 text-right font-semibold text-slate-800">${Number(order.total).toFixed(2)}</td>
                    <td className="px-3 py-2 border-r border-slate-50 text-right text-slate-400">{order.realInvoiceTotal ? `${Number(order.realInvoiceTotal).toFixed(2)}` : '-'}</td>
                    <td className="px-3 py-2 border-r border-slate-50 text-right font-semibold text-green-700">${paid.toFixed(2)}</td>
                    <td className={`px-3 py-2 border-r border-slate-50 text-right font-bold ${pending > 0 ? 'text-red-600' : 'text-slate-400'}`}>${pending.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      <button type="button" onClick={() => removeRow(order.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Quitar">
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {rows.length > 0 && (
          <div className="flex justify-end gap-8 px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs">
            <div className="flex gap-1 items-center"><span className="font-bold text-slate-500 uppercase tracking-wide">Total:</span><span className="font-black text-slate-800">${totalOrders.toFixed(2)}</span></div>
            <div className="flex gap-1 items-center"><span className="font-bold text-slate-500 uppercase tracking-wide">Abonado:</span><span className="font-black text-green-700">${totalPaid.toFixed(2)}</span></div>
            <div className="flex gap-1 items-center"><span className="font-bold text-slate-500 uppercase tracking-wide">Saldo:</span><span className={`font-black ${totalPending > 0 ? 'text-red-600' : 'text-slate-800'}`}>${totalPending.toFixed(2)}</span></div>
          </div>
        )}
      </div>

      <AddOrdersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        alreadyAdded={rows.map((r) => r.order.id)}
        onConfirm={addOrders}
      />
    </div>
  );
}
