import { useState } from 'react';
import { 
  Plus, Search, RefreshCw, Trash2, Send, CheckCircle2, Replace
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/shared/ui/dialog';
import { useNotifications } from '@/shared/lib/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useOrderList } from '@/entities/order/model/hooks';
import { orderApi } from '@/entities/order/model/api';
import { AsyncButton } from '@/shared/ui/async-button';
import type { Order } from '@/entities/order/model/types';
import type { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/shared/ui/filters/DateRangePicker';
import { usePDFPreview } from '@/shared/hooks/usePDFPreview';
import { PDFPreviewModal } from '@/shared/ui/PDFPreviewModal';
import { PageHeader } from '@/shared/ui/PageHeader';

export function ExchangesPage() {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotifications();
  const queryClient = useQueryClient();
  const { 
    closePreview, 
    isOpen, 
    pdfDocument, 
    downloadPDF, 
    printPDF 
  } = usePDFPreview({ fileName: 'recibo-cambio.pdf' });

  // Filters & State
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stagedOrders, setStagedOrders] = useState<Order[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shipmentData, setShipmentData] = useState({
    isOpen: false,
    batchId: null as string | null,
    trackingGuide: ''
  });
  const [deleteData, setDeleteData] = useState({ 
    isOpen: false, 
    receiptNumber: null as string | null 
  });

  // Query Data
  const { data, isLoading } = useOrderList({
    page,
    limit: 50,
    search: searchText,
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
    status: 'POR_ENVIAR',
    type: 'CAMBIO'
  });

  const orders = data?.data || [];
  const pagination = data?.pagination;

  const clearFilters = () => {
    setSearchText('');
    setDateRange(undefined);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleStartShipment = async () => {
    if (!shipmentData.trackingGuide) {
      return notifyError(null, "Debe ingresar el N° de Guía antes de finalizar el envío");
    }

    setIsUpdatingStatus(true);
    try {
      for (const o of stagedOrders) {
        await orderApi.update(o.id, { 
          status: 'POR_RECIBIR', 
          trackingGuide: shipmentData.trackingGuide 
        } as any);
      }
      notifySuccess("Envío procesado correctamente. Los pedidos ahora están en estado 'Por Recibir'");
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStagedOrders([]);
      setShipmentData({ isOpen: false, batchId: null, trackingGuide: '' });
    } catch (e: any) {
      notifyError(e, "Error al procesar el envío");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteData.receiptNumber) return;
    try {
      setIsDeleting(true);
      const itemToDelete = orders.find(o => o.id === deleteData.receiptNumber);
      if (!itemToDelete) throw new Error("No se encontró el ítem");
      await orderApi.delete(itemToDelete.id);
      notifySuccess(`Ítem eliminado correctamente.`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDeleteData({ isOpen: false, receiptNumber: null });
    } catch (error: any) {
      notifyError(error, "Error al eliminar el ítem.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestión de Cambios"
        description="Módulo de procesamiento de cambios"
        icon={Replace}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Button 
                variant="outline" 
                className="rounded-xl h-12 px-6 font-bold border-slate-200"
                onClick={() => navigate('/exchanges/new')}
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo Cambio
              </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-8">
        {/* STEP 1: POR ENVIAR (AVAILABLE ITEMS) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-monchito-purple flex items-center gap-2 uppercase tracking-widest">
                 <span className="bg-monchito-purple/10 text-monchito-purple w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                 POR ENVIAR
              </h2>
           </div>

           {/* Filters */}
           <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Buscar por empresaria, catálogo, N° cambio..." 
                      className="pl-11 h-10 bg-slate-50/50 border-slate-100 rounded-xl focus:ring-monchito-purple/20 transition-all font-medium text-xs w-full"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <DateRangePicker 
                      value={dateRange}
                      onChange={setDateRange}
                      buttonClassName="h-10 border-slate-100 bg-slate-50/50 min-w-[200px]"
                      showLabel={false}
                    />
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="ghost" 
                        onClick={clearFilters}
                        className="flex-1 sm:flex-none h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-2" /> Limpiar
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          const selected = orders.filter(o => selectedIds.has(o.id));
                          setStagedOrders(prev => [...prev, ...selected]);
                          setSelectedIds(new Set());
                        }}
                        disabled={selectedIds.size === 0}
                        className="flex-1 sm:flex-none h-10 rounded-xl bg-monchito-purple hover:bg-monchito-purple/90 text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-lg shadow-monchito-purple/20"
                      >
                        Preparar Seleccionados ({selectedIds.size})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
           </Card>

           {/* Table Component */}
           <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-500 ${stagedOrders.length > 0 ? 'max-h-[300px] opacity-70' : 'min-h-[400px]'}`}>
              {stagedOrders.length > 0 && (
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paso 1: Lista de Cambios Disponibles</span>
                   </div>
                   <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase text-monchito-purple" onClick={() => setStagedOrders([])}>Expandir y Editar Selección</Button>
                </div>
              )}

              <div className="overflow-x-auto custom-scrollbar">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <div className="h-10 w-10 border-4 border-monchito-purple border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Cargando...</p>
                  </div>
                ) : (
                  <table className="text-[10px] border-collapse min-w-[1500px] w-full">
                    <thead>
                      <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10 text-[10px] uppercase tracking-widest text-monchito-purple font-bold">
                        <th className="px-3 py-3 text-center w-10">
                          <input
                            type="checkbox"
                            className="accent-monchito-purple rounded"
                            checked={orders.length > 0 && orders.every(o => selectedIds.has(o.id))}
                            onChange={() => {
                              if (orders.every(o => selectedIds.has(o.id))) setSelectedIds(new Set());
                              else setSelectedIds(new Set(orders.map(o => o.id)));
                            }}
                          />
                        </th>
                        <th className="px-3 py-3 text-center w-10">N</th>
                        <th className="px-3 py-3 text-left">Empresaria</th>
                        <th className="px-3 py-3 text-left">Catálogo</th>
                        <th className="px-3 py-3 text-center">N° Cambio (SN)</th>
                        <th className="px-3 py-3 text-center">N° Cambio (CAM)</th>
                        <th className="px-3 py-3 text-center w-12">Cant</th>
                        <th className="px-3 py-3 text-left">Desc. Se Va</th>
                        <th className="px-3 py-3 text-left">Desc. Viene</th>
                        <th className="px-3 py-3 text-right">Valor</th>
                        <th className="px-3 py-3 text-right">Abono</th>
                        <th className="px-3 py-3 text-right">Saldo</th>
                        <th className="px-3 py-3 text-center">Fecha Entrega</th>
                        <th className="px-3 py-3 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.filter(o => !stagedOrders.find(so => so.id === o.id)).map((order: Order, idx: number) => {
                        const isSelected = selectedIds.has(order.id);
                        return (
                          <tr 
                            key={order.id} 
                            className={`hover:bg-monchito-purple/5 transition-all cursor-pointer ${isSelected ? 'bg-monchito-purple/[0.08]' : ''}`}
                            onClick={() => {
                              const next = new Set(selectedIds);
                              if (next.has(order.id)) next.delete(order.id);
                              else next.add(order.id);
                              setSelectedIds(next);
                            }}
                          >
                            <td className="px-3 py-2 text-center">
                              <input type="checkbox" checked={isSelected} readOnly className="accent-monchito-purple rounded" />
                            </td>
                            <td className="px-3 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                            <td className="px-3 py-2 font-bold text-slate-800 uppercase">{order.clientName}</td>
                            <td className="px-3 py-2 font-bold text-slate-600 uppercase">{order.brandName}</td>
                            <td className="px-3 py-2 text-center font-mono font-black text-monchito-purple">{order.sourceOrderNumber || '---'}</td>
                            <td className="px-3 py-2 text-center font-bold text-monchito-purple">{order.orderNumber}</td>
                            <td className="px-3 py-2 text-center font-black">{order.items?.[0]?.quantity || 1}</td>
                            <td className="px-3 py-2 text-slate-500 italic truncate max-w-[150px]">{order.sourceDescription || 'N/A'}</td>
                            <td className="px-3 py-2 text-slate-800 font-medium truncate max-w-[150px]">{order.description}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-700">${Number(order.total).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-600">${Number(order.deposit || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-bold text-red-500">${(Number(order.total) - Number(order.deposit || 0)).toFixed(2)}</td>
                            <td className="px-3 py-2 text-center text-slate-400 font-bold">{order.possibleDeliveryDate ? format(new Date(order.possibleDeliveryDate), 'dd/MM/yyyy') : '--/--/--'}</td>
                            <td className="px-3 py-2 text-center"></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
           </div>
        </div>

        {/* STEP 2: ZONA DE ENVÍO */}
        {stagedOrders.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-monchito-purple/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-monchito-purple flex items-center gap-2">
                            <span className="bg-monchito-purple/10 text-monchito-purple w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Zona de Envío
                        </h2>
                        <span className="text-xs font-mono bg-monchito-purple/10 text-monchito-purple px-2 py-0.5 rounded-full font-bold">
                            {stagedOrders.length} {stagedOrders.length === 1 ? 'cambio' : 'cambios'}
                        </span>
                    </div>

                    <div className="flex flex-1 flex-wrap gap-6 items-center justify-end w-full sm:w-auto">
                        <div className="flex gap-4 items-center">
                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] text-monchito-purple font-black uppercase tracking-widest">N° de Guía</Label>
                                <Input 
                                    className="h-8 w-40 text-[11px] font-bold border-monchito-purple/20 bg-white rounded-lg focus:ring-1 focus:ring-monchito-purple shadow-sm" 
                                    placeholder="Ej: GUIA123..."
                                    value={shipmentData.trackingGuide}
                                    onChange={(e) => setShipmentData(prev => ({ ...prev, trackingGuide: e.target.value.toUpperCase() }))}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] text-monchito-purple font-black uppercase tracking-widest">Saldo Total Lote ($)</Label>
                                <span className="h-8 flex items-center font-mono font-bold text-red-600 text-sm">
                                    ${stagedOrders.reduce((acc, curr) => acc + (Number(curr.total) - Number(curr.deposit || 0)), 0).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <AsyncButton 
                            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold h-10 px-8 shadow-sm flex items-center gap-2 rounded-xl transition-all active:scale-95"
                            onClick={handleStartShipment}
                            isLoading={isUpdatingStatus}
                        >
                            <Send className="h-4 w-4" /> Finalizar Envío
                        </AsyncButton>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-0">
                  <table className="text-[10px] border-collapse min-w-[1500px] w-full">
                    <thead>
                      <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10 text-[10px] uppercase tracking-widest text-monchito-purple font-bold">
                        <th className="px-4 py-4 text-center w-12"></th>
                        <th className="px-3 py-4 text-center w-12">N</th>
                        <th className="px-3 py-4 text-left">Empresaria</th>
                        <th className="px-3 py-4 text-left">Catálogo</th>
                        <th className="px-3 py-4 text-center">N° Cambio (SN)</th>
                        <th className="px-3 py-4 text-center">N° Cambio (CAM)</th>
                        <th className="px-3 py-4 text-center w-16">Cant</th>
                        <th className="px-3 py-4 text-left">Desc. Se Va</th>
                        <th className="px-3 py-4 text-left">Desc. Viene</th>
                        <th className="px-4 py-4 text-right">Valor</th>
                        <th className="px-4 py-4 text-right">Abono</th>
                        <th className="px-4 py-4 text-right">Saldo</th>
                        <th className="px-3 py-4 text-center font-bold">Fecha Entrega</th>
                        <th className="px-4 py-4 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stagedOrders.map((order, idx) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                          </td>
                          <td className="px-3 py-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="px-3 py-3 font-bold text-slate-800 uppercase">{order.clientName}</td>
                          <td className="px-3 py-3 font-bold text-slate-600 uppercase">{order.brandName}</td>
                          <td className="px-3 py-3 text-center font-mono font-black text-monchito-purple">{order.sourceOrderNumber || '---'}</td>
                          <td className="px-3 py-3 text-center font-bold text-monchito-purple">{order.orderNumber}</td>
                          <td className="px-3 py-3 text-center font-black">{order.items?.[0]?.quantity || 1}</td>
                          <td className="px-3 py-3 text-slate-500 italic truncate max-w-[150px]">{order.sourceDescription || 'N/A'}</td>
                          <td className="px-3 py-2 text-slate-800 font-medium truncate max-w-[150px] text-monchito-purple">{order.description}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700">${Number(order.total).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">${Number(order.deposit || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-500">${(Number(order.total) - Number(order.deposit || 0)).toFixed(2)}</td>
                          <td className="px-3 py-3 text-center text-slate-400 font-bold">{order.possibleDeliveryDate ? format(new Date(order.possibleDeliveryDate), 'dd/MM/yyyy') : '--/--/--'}</td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => setStagedOrders(prev => prev.filter(so => so.id !== order.id))}
                              className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between py-4">
            <span className="text-xs font-bold text-slate-400">Página {page} de {pagination.pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>Primera</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))} disabled={page === pagination.pages}>Siguiente</Button>
            </div>
          </div>
        )}
      </div>
      
      <Dialog open={deleteData.isOpen} onOpenChange={(o) => setDeleteData(prev => ({ ...prev, isOpen: o }))}>
        <DialogContent className="max-w-md rounded-3xl">
           <DialogHeader>
             <DialogTitle className="text-xl font-black text-slate-800">Eliminar Cambio</DialogTitle>
             <p className="text-sm font-medium text-slate-500">¿Está seguro de eliminar este ítem de cambio? Esta acción no se puede deshacer.</p>
           </DialogHeader>
           <DialogFooter className="gap-2 pt-4">
              <Button variant="ghost" onClick={() => setDeleteData({ isOpen: false, receiptNumber: null })}>Cancelar</Button>
              <AsyncButton 
                variant="destructive"
                isLoading={isDeleting}
                onClick={handleDeleteBatch}
                className="bg-red-500 text-white font-black px-8 rounded-xl"
              >
                Confirmar Eliminación
              </AsyncButton>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      <PDFPreviewModal 
        open={isOpen} 
        onOpenChange={(open: boolean) => !open && closePreview()}
        title="Vista Previa del Recibo"
        pdfDocument={pdfDocument || <></>}
        fileName="recibo-cambio.pdf"
        onDownload={() => downloadPDF()}
        onPrint={() => printPDF()}
      />
    </div>
  );
}
