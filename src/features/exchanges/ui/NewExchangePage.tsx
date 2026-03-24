import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  FileText, 
  User, 
  Hash, 
  Calendar, 
  PackageSearch,
  Check,
  X,
  Filter,
  ClipboardList
} from 'lucide-react';
import { useToast } from '../../../shared/ui/use-toast';

import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Badge } from '../../../shared/ui/badge';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../shared/ui/dialog';
import { clientApi } from '../../../shared/api/clientApi';
import { orderApi } from '../../../entities/order/model/api';
import { exchangesApi } from '../lib/exchangesApi';
import type { Client } from '../../../entities/client/model/types';
import type { Order } from '../../../entities/order/model/types';

interface AddOrdersModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (orders: Order[]) => void;
  alreadyAddedIds: string[];
}

function AddOrdersModal({ open, onClose, onAdd, alreadyAddedIds }: AddOrdersModalProps) {
  const [step, setStep] = useState<'CLIENT' | 'ORDERS'>('CLIENT');
  const [clientQuery, setClientQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Filters for orders
  const [filters, setFilters] = useState({ brand: '', orderNumber: '', date: '' });
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Client Search
  useEffect(() => {
    if (!clientQuery.trim()) { setClients([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSearchingClients(true);
      try {
        const res = await (clientApi as any).getAll({ search: clientQuery, limit: 10 });
        setClients(res?.data ?? []);
      } catch { setClients([]); }
      finally { setSearchingClients(false); }
    }, 350);
  }, [clientQuery]);

  // Fetch orders when client is selected
  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    setStep('ORDERS');
    setLoadingOrders(true);
    try {
      const res = await orderApi.getAll({ 
        clientId: client.id, 
        status: 'ENTREGADO', 
        limit: 100 
      });
      const data = res?.data ?? [];
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...orders];
    if (filters.brand) {
      result = result.filter(o => o.brandName?.toLowerCase().includes(filters.brand.toLowerCase()));
    }
    if (filters.orderNumber) {
      result = result.filter(o => o.orderNumber?.toLowerCase().includes(filters.orderNumber.toLowerCase()) || o.receiptNumber?.toLowerCase().includes(filters.orderNumber.toLowerCase()));
    }
    if (filters.date) {
      result = result.filter(o => o.createdAt?.startsWith(filters.date));
    }
    setFilteredOrders(result);
  }, [filters, orders]);

  const toggleOrder = (id: string) => {
    const next = new Set(selectedOrderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrderIds(next);
  };

  const resetModal = () => {
    setStep('CLIENT');
    setClientQuery('');
    setSelectedClient(null);
    setSelectedOrderIds(new Set());
    setFilters({ brand: '', orderNumber: '', date: '' });
  };

  const handleConfirm = () => {
    const selected = orders.filter(o => selectedOrderIds.has(o.id));
    onAdd(selected);
    onClose();
    resetModal();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); resetModal(); } }}>
      <DialogContent className="max-w-4xl w-full h-[600px] p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl flex flex-col bg-white">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 flex flex-row items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-monchito-purple rounded-full flex items-center justify-center text-white shadow-md shadow-monchito-purple/20">
              <PackageSearch className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {step === 'CLIENT' ? '1. Buscar Empresaria' : `2. Pedidos de ${selectedClient?.firstName}`}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'CLIENT' ? (
            <div className="p-6 space-y-4 h-full flex flex-col">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Ingresa nombre o cédula de la empresaria..."
                  className="pl-10 h-11 text-sm rounded-xl border-slate-200 focus:ring-monchito-purple/20 bg-slate-50/30"
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  autoFocus
                />
                {searchingClients && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 border-2 border-monchito-purple border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-monchito-purple hover:bg-monchito-purple/5 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-monchito-purple/20 group-hover:text-monchito-purple transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{client.firstName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{client.identificationNumber} • {client.city}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-monchito-purple font-black uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Seleccionar <Check className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {clientQuery && !searchingClients && clients.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    <Search className="h-12 w-12 mb-3 opacity-20" />
                    No se encontraron empresarias
                  </div>
                )}
                {!clientQuery && !searchingClients && (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-slate-300 font-medium">
                    <User className="h-12 w-12 mb-3 opacity-20" />
                    Busca una empresaria para ver sus pedidos
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-slate-50/30">
               {/* Local Filters */}
               <div className="p-4 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                  <div className="relative">
                     <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                     <Input 
                        placeholder="Filtrar Marca..." 
                        className="h-9 pl-9 text-xs rounded-lg border-slate-200" 
                        value={filters.brand} 
                        onChange={(e) => setFilters({...filters, brand: e.target.value})} 
                     />
                  </div>
                  <div className="relative">
                     <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                     <Input 
                        placeholder="N° Pedido..." 
                        className="h-9 pl-9 text-xs rounded-lg border-slate-200" 
                        value={filters.orderNumber} 
                        onChange={(e) => setFilters({...filters, orderNumber: e.target.value})} 
                     />
                  </div>
                  <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                     <Input 
                        type="date"
                        className="h-9 pl-9 text-xs rounded-lg border-slate-200" 
                        value={filters.date} 
                        onChange={(e) => setFilters({...filters, date: e.target.value})} 
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {loadingOrders ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando pedidos...</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center text-slate-400 font-medium font-bold uppercase tracking-widest text-xs">No hay pedidos entregados</div>
                  ) : (
                    filteredOrders.map((order) => {
                      const isAdded = alreadyAddedIds.includes(order.id);
                      const isSelected = selectedOrderIds.has(order.id);
                      return (
                        <div
                          key={order.id}
                          onClick={() => !isAdded && toggleOrder(order.id)}
                          className={`p-4 border rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-sm
                            ${isAdded ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-100' : isSelected ? 'border-monchito-purple bg-monchito-purple/5 ring-1 ring-monchito-purple shadow-monchito-purple/10' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-monchito-purple border-monchito-purple text-white' : 'border-slate-200 bg-white'}`}>
                                {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={4} />}
                             </div>
                             <div className="space-y-0.5">
                                <p className="text-sm font-black text-slate-800 tracking-tight uppercase">{order.brandName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                  Recibo: {order.receiptNumber} • N° Pedido: {order.orderNumber || '---'}
                                </p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-slate-900 tracking-tight">${Number(order.total).toFixed(2)}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
               </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => setStep('CLIENT')} 
            className={`text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-monchito-purple transition-all ${step === 'CLIENT' ? 'invisible' : ''}`}
          >
            <ArrowLeft className="h-3 w-3 mr-1" /> Cambiar Empresaria
          </Button>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => { onClose(); resetModal(); }} className="rounded-xl uppercase text-[10px] font-black tracking-widest px-6 h-10 border-slate-200">
               Cerrar
             </Button>
             <Button 
               onClick={handleConfirm} 
               disabled={selectedOrderIds.size === 0}
               className="bg-monchito-purple hover:bg-monchito-purple/90 text-white rounded-xl px-6 h-10 uppercase text-[10px] font-black tracking-widest shadow-lg shadow-monchito-purple/20 transition-all active:scale-95"
             >
               Agregar Seleccionados ({selectedOrderIds.size})
             </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewExchangePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [trackingGuide, setTrackingGuide] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddOrders = (newOrders: Order[]) => {
    setSelectedOrders(prev => {
      const ids = new Set(prev.map(o => o.id));
      const filtered = newOrders.filter(no => !ids.has(no.id));
      return [...prev, ...filtered];
    });
  };

  const removeOrder = (id: string) => {
    setSelectedOrders(prev => prev.filter(o => o.id !== id));
  };

  const currentBatchTotal = selectedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const handleSubmit = async () => {
    if (selectedOrders.length === 0) {
      showToast('Agrega al menos un pedido', 'error');
      return;
    }
    if (!trackingGuide.trim()) {
      showToast('El número de guía es obligatorio', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      await exchangesApi.createBatch({
        trackingGuide,
        notes: notes || undefined,
        items: selectedOrders.map(o => ({ orderId: o.id }))
      });
      showToast('Guía de cambio guardada exitosamente', 'success');
      navigate('/exchanges');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la guía', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      <PageHeader
        title="Registro de Guía de Cambio"
        description="Agrupa múltiples pedidos para enviar al proveedor en un solo lote"
        icon={FileText}
        actions={
          <Button
            variant="ghost"
            onClick={() => navigate('/exchanges')}
            className="text-monchito-purple font-bold hover:bg-monchito-purple/5 h-8 rounded-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Cambios
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Info Card */}
        <Card className="lg:col-span-3 shadow-sm border-slate-200 bg-white rounded-2xl">
           <CardHeader className="py-2 px-4 bg-monchito-purple/5 border-b border-monchito-purple/10 rounded-t-2xl">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-monchito-purple">Información de la Guía</CardTitle>
           </CardHeader>
           <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                 <Label htmlFor="tracking" className="text-xs font-bold text-slate-600">No de Guía / Tracking:</Label>
                 <Input 
                    id="tracking"
                    placeholder="Ej: GU-2024-X123"
                    className="h-8 text-sm font-mono font-bold text-monchito-purple bg-monchito-purple/5 border-slate-200 rounded-md focus:ring-monchito-purple/20"
                    value={trackingGuide}
                    onChange={(e) => setTrackingGuide(e.target.value)}
                 />
              </div>
              <div className="space-y-1">
                 <Label htmlFor="notes" className="text-xs font-bold text-slate-600">Notas / Comentario:</Label>
                 <Input 
                    id="notes"
                    placeholder="Motivo del envío o detalles adicionales..."
                    className="h-8 text-sm border-slate-200 rounded-md font-medium focus:ring-monchito-purple/20"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                 />
              </div>
           </CardContent>
        </Card>

        {/* Global Values / Summary Card */}
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl flex flex-col h-full">
           <CardHeader className="py-2 px-4 bg-monchito-purple/5 border-b border-monchito-purple/10 rounded-t-2xl">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-monchito-purple">Valores</CardTitle>
           </CardHeader>
           <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center text-sm">
                 <span className="font-bold text-slate-500">Total pedidos:</span>
                 <span className="font-bold text-slate-900">{selectedOrders.length}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                 <span className="text-xs font-bold uppercase text-slate-400 tracking-tight">Valor Total Lote:</span>
                 <span className="text-xl font-black text-monchito-purple">
                    ${currentBatchTotal.toFixed(2)}
                 </span>
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-3 bg-monchito-purple/5 border-b border-monchito-purple/10 flex items-center justify-between gap-3">
           <span className="text-[10px] font-black uppercase tracking-widest text-monchito-purple flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Detalle de Pedidos Cargados
           </span>
           <Button 
                type="button"
                onClick={() => setModalOpen(true)}
                className="h-8 bg-monchito-purple hover:bg-monchito-purple/90 px-3 text-xs font-bold transition-all rounded-lg"
            >
                <Plus className="h-3 w-3 mr-1.5" /> Agregar Pedidos
            </Button>
        </div>

        <div className="overflow-x-auto bg-white">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10">
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-center w-12 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N°</th>
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Empresaria</th>
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N° Orden</th>
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N° Pedido</th>
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Marca</th>
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">V. Pedido</th>
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">V. Factura</th>
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest text-emerald-600">Abonado</th>
                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Saldo</th>
                    <th className="px-2 py-3 text-center w-20 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Acciones</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 italic-last:bg-slate-50/5">
                 {selectedOrders.length === 0 ? (
                   <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-400 italic text-xs">Aún no hay pedidos agregados en este lote</td>
                   </tr>
                 ) : (
                   selectedOrders.map((order, idx) => {
                     const abono = (order.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                     const saldo = Number(order.total || 0) - abono;
                     return (
                       <tr key={order.id} className="hover:bg-monchito-purple/5 transition-all duration-200 border-b border-slate-50 last:border-0">
                          <td className="px-2 py-2 border-r border-slate-50 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-2 py-2 border-r border-slate-50">
                             <p className="text-xs font-bold text-slate-800 tracking-tight">{order.clientName}</p>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-50 text-center">
                             <span className="text-[10px] font-black text-monchito-purple font-mono tracking-tighter bg-monchito-purple/5 px-2 py-0.5 rounded border border-monchito-purple/10">
                                {order.receiptNumber}
                             </span>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-50 text-center">
                             <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter">{order.orderNumber || '---'}</span>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-50 text-center">
                             <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-500 font-bold uppercase tracking-tight rounded-md">
                                {order.brandName}
                             </Badge>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-50 text-right">
                             <span className="text-xs font-bold text-slate-800 font-mono tracking-tight">${Number(order.total).toFixed(2)}</span>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-50 text-right">
                             <span className="text-xs font-bold text-slate-800 font-mono tracking-tight">${Number(order.total).toFixed(2)}</span>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-50 text-right">
                             <span className="text-xs font-black text-emerald-600 font-mono tracking-tight">${abono.toFixed(2)}</span>
                          </td>
                          <td className="px-2 py-2 border-r border-slate-50 text-right">
                             <span className={`text-xs font-black font-mono tracking-tight ${saldo > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                ${saldo.toFixed(2)}
                             </span>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                             <div className="flex justify-center gap-1">
                                <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   onClick={() => removeOrder(order.id)}
                                   className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                   <X className="h-4 w-4" />
                                </Button>
                             </div>
                          </td>
                       </tr>
                     );
                   })
                 )}
              </tbody>
           </table>
        </div>
      </Card>

      {/* Manual Save Button outside main grids to match orders style */}
      <div className="flex justify-end pt-2">
        <Button 
            onClick={handleSubmit}
            disabled={submitting || selectedOrders.length === 0 || !trackingGuide.trim()}
            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black h-10 px-8 rounded-lg shadow-lg shadow-monchito-purple/20 transition-all flex items-center gap-2"
        >
            <Plus className="h-4 w-4" /> {submitting ? 'Guardando...' : 'Guardar Guía de Envío'}
        </Button>
      </div>

      <AddOrdersModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onAdd={handleAddOrders}
        alreadyAddedIds={selectedOrders.map(o => o.id)}
      />
    </div>
  );
}
