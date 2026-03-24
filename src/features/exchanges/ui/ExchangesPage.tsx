import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar,
  Package,
  Truck,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Badge } from '../../../shared/ui/badge';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { useExchangeBatches, useUpdateExchangeBatchStatus } from '../model/useExchanges';
import { useToast } from '../../../shared/ui/use-toast';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../shared/ui/dialog';
import type { ExchangeBatch } from '../model/types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente de Envío',
  SENT: 'Enviado a Bodega',
  RECEIVED: 'Recibido / Procesado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  RECEIVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function ExchangesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<ExchangeBatch | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [batchIdToSend, setBatchIdToSend] = useState<string | null>(null);

  const { data: batches = [], isLoading, refetch } = useExchangeBatches();
  const updateStatus = useUpdateExchangeBatchStatus();

  const handleSendToSupplier = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBatchIdToSend(id);
    setConfirmOpen(true);
  };

  const onConfirmSend = async () => {
    if (!batchIdToSend) return;
    try {
      await updateStatus.mutateAsync({ id: batchIdToSend, newStatus: 'SENT' });
      showToast('Lote marcado como enviado a bodega', 'success');
      refetch();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar estado', 'error');
    }
  };

  const filtered = (batches as ExchangeBatch[] || []).filter(
    (b) =>
      (b.batchNumber?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (b.trackingGuide?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (b.notes?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guías de Cambio"
        description="Historial y gestión de lotes enviados al proveedor"
        icon={Truck}
        actions={
          <Button
            onClick={() => navigate('/exchanges/new')}
            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black rounded-xl shadow-lg shadow-monchito-purple/20 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nueva Guía
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por N° guía o notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-monchito-purple/20"
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
             <div className="h-10 w-10 border-4 border-monchito-purple border-t-transparent rounded-full animate-spin" />
             <p className="text-sm font-bold text-slate-400 animate-pulse">Cargando guías...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white border border-slate-200 rounded-2xl text-slate-300 shadow-sm">
            <div className="p-4 bg-slate-50 rounded-full">
              <ClipboardList className="h-10 w-10" />
            </div>
            <div className="text-center">
              <p className="text-slate-500 font-bold">No se encontraron guías</p>
              <p className="text-xs mt-1">Registra una nueva guía de envío para comenzar</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold whitespace-nowrap">
                    <th className="px-4 py-4 text-center w-16">N°</th>
                    <th className="px-6 py-4 text-left">Guía / Lote</th>
                    <th className="px-6 py-4 text-left">Información / Notas</th>
                    <th className="px-6 py-4 text-left">Estado</th>
                    <th className="px-6 py-4 text-left">Pedidos</th>
                    <th className="px-6 py-4 text-left">Fecha Registro</th>
                    <th className="px-6 py-4 text-center w-10">Fact.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((batch, idx) => (
                    <tr 
                      key={batch.id} 
                      onClick={() => setSelectedBatch(batch)}
                      className="hover:bg-slate-50/40 transition-all cursor-pointer group"
                    >
                      <td className="px-4 py-5 text-center">
                        <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-monchito-purple shadow-sm" />
                          <span className="font-mono font-black text-monchito-purple text-sm tracking-tight">
                            {batch.trackingGuide || batch.batchNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                        <p className="text-sm font-semibold text-slate-700 truncate">{batch.notes || 'Sin notas adicionales'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Registrado por: {batch.createdByName || 'Sistema'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className={`${STATUS_COLORS[batch.status]} border font-black uppercase text-[9px] tracking-widest px-2.5 py-1 rounded-xl shadow-sm`}>
                          {STATUS_LABELS[batch.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-600 text-xs bg-slate-100 w-fit px-2 py-1 rounded-lg">
                          <Package className="h-3 w-3" />
                          {batch.items?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap uppercase tracking-tighter">
                          {new Date(batch.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-monchito-purple hover:bg-monchito-purple/5 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal (Dialog Horizontal Rectangular) */}
      <Dialog open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-4xl w-full p-0 gap-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          {selectedBatch && (
            <>
              <DialogHeader className="p-6 bg-monchito-purple text-white relative">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <DialogTitle className="text-white text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                        <Truck className="h-6 w-6" /> Detalle de Guía
                      </DialogTitle>
                      <p className="text-white/70 text-sm font-medium">
                        Consultando pedidos asociados a la guía {selectedBatch.trackingGuide || selectedBatch.batchNumber}
                      </p>
                   </div>
                   <Badge className="bg-white/20 text-white border-white/30 font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full">
                     {selectedBatch.status}
                   </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 bg-slate-50 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pedidos</p>
                    <p className="text-2xl font-black text-slate-800">{selectedBatch.items?.length || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Registro</p>
                    <p className="text-sm font-bold text-slate-800">{new Date(selectedBatch.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm md:col-span-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notas</p>
                    <p className="text-sm font-medium text-slate-600 truncate">{selectedBatch.notes || 'Sin notas'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 mt-2">Listado de Pedidos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedBatch.items?.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-monchito-purple/30 transition-all group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-800 text-sm">{item.clientName}</span>
                             <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-500 font-bold uppercase tracking-tight">
                               {item.receiptNumber}
                             </Badge>
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                             <Calendar className="h-3 w-3" /> {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">${Number(item.orderTotal).toFixed(2)}</p>
                          <p className="text-[10px] font-bold text-green-600 uppercase tracking-tight">Abonado: ${Number(item.paidAmount).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedBatch.items?.length === 0 && (
                    <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                      No hay pedidos en esta guía
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="p-6 bg-white border-t border-slate-100 flex gap-3">
                 <Button 
                   variant="outline" 
                   className="flex-1 rounded-xl h-11 font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                   onClick={() => setSelectedBatch(null)}
                 >
                   Cerrar Detalle
                 </Button>
                 {selectedBatch.status === 'PENDING' && (
                   <Button 
                     className="flex-1 bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black h-11 rounded-xl shadow-lg shadow-monchito-purple/20 transition-all active:scale-95"
                     onClick={(e) => handleSendToSupplier(e, selectedBatch.id)}
                   >
                     Marcar como Enviado
                   </Button>
                 )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={onConfirmSend}
        title="Confirmar Envío"
        description="¿Confirmas que esta guía ha sido enviada físicamente a bodega/proveedor?"
        confirmText="Confirmar Envío"
        cancelText="Cancelar"
      />
    </div>
  );
}
