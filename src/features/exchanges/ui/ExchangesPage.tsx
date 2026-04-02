import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  RotateCcw,
  Replace,
  ArrowRightLeft,
  ChevronRight,
  ClipboardList,
  ListOrdered,
  FileDown,
  Loader2,
  Trash2,
  Edit,
  Edit2,
  X,
  AlertTriangle,
  Send,
  PackageOpen
} from 'lucide-react';

import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Badge } from '../../../shared/ui/badge';
import { Label } from '../../../shared/ui/label';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { DateRangePicker } from '@/shared/ui/filters/DateRangePicker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOrderList } from '@/entities/order/model/hooks';
import { Pagination } from '@/shared/ui/pagination';
import { useDebounce } from '@/shared/lib/hooks';
import { exportExchangesToExcel } from '@/shared/lib/exportExcel';
import { orderApi } from '@/entities/order/model/api';
import type { Order } from '@/entities/order/model/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../shared/ui/dialog';
import { useAuth } from '@/shared/auth';
import { useNotifications } from '@/shared/lib/notifications';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";

const STATUS_LABELS: Record<string, string> = {
  POR_ENVIAR: 'Enviado a Oficina',
  RECOLECTADO: 'Recolectado',
  EN_TRANSITO: 'En Tránsito',
  POR_RECIBIR: 'Enviado',
  RECIBIDO_EN_BODEGA: 'En Bodega',
  ENTREGADO: 'Entregado al Cliente',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  POR_ENVIAR: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  RECOLECTADO: 'bg-violet-100 text-violet-700 border-violet-200',
  EN_TRANSITO: 'bg-sky-100 text-sky-700 border-sky-200',
  POR_RECIBIR: 'bg-blue-100 text-blue-700 border-blue-200',
  RECIBIDO_EN_BODEGA: 'bg-amber-100 text-amber-700 border-amber-200',
  ENTREGADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '--/--/--';
  return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: es });
};

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
}

const parseExchangeNotesDetailed = (notes: string) => {
    const regex = /CAMBIO DE \[([^\s]+)\s+(.*?)\s*x(\d+):\s*([\s\S]*?)\]\s*POR\s*\[(.*?)\s*x(\d+):\s*([\s\S]*?)\]/i;
    const match = notes?.match(regex);
    if (match) {
        return {
            originalOrder: match[1],
            originalBrand: match[2],
            originalQty: match[3],
            originalDesc: match[4],
            newBrand: match[5],
            newQty: match[6],
            newDesc: match[7]
        };
    }
    return {
        originalOrder: 'N/A',
        originalBrand: 'N/A',
        originalQty: '-',
        originalDesc: notes || 'Sin detalles',
        newBrand: 'N/A',
        newQty: '-',
        newDesc: 'Sin detalles'
    };
};

export function ExchangesPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 500)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const limit = 15; 
  const [isExporting, setIsExporting] = useState(false);
  
  const [selectedGroup, setSelectedGroup] = useState<Order[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [shipmentData, setShipmentData] = useState<{ isOpen: boolean; batchId: string | null; trackingGuide: string }>({ 
    isOpen: false, 
    batchId: null, 
    trackingGuide: '' 
  });
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; receiptNumber: string | null }>({ isOpen: false, receiptNumber: null });
  const [editingReceipt, setEditingReceipt] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  
  const { notifySuccess, notifyError } = useNotifications();
  const queryClient = useQueryClient();

  const handleStatusUpdate = async (batchId: string, newStatus: string, tracking?: string) => {
    try {
      setIsUpdatingStatus(true);
      await orderApi.updateExchangeBatchStatus(batchId, newStatus, tracking);
      notifySuccess(`El lote ha sido movido a ${STATUS_LABELS[newStatus] || newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // If we are in the details modal, we need to refresh the group
      if (selectedGroup) {
        const firstOrder = selectedGroup[0];
        if (firstOrder.receiptNumber) {
            const updated = await orderApi.getByReceipt(firstOrder.receiptNumber);
            setSelectedGroup(updated);
        }
      }
      setShipmentData({ isOpen: false, batchId: null, trackingGuide: '' });
    } catch (error: any) {
      notifyError(error.message || 'No se pudo cambiar el estado');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStartShipment = (batchId: string) => {
    setShipmentData({ isOpen: true, batchId, trackingGuide: '' });
  };

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateRange, selectedStatus]);

  const filters = {
    type: 'CAMBIO',
    search: debouncedSearch,
    startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
    endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
    status: selectedStatus || undefined,
    page,
    limit,
  };

  const { data: response, isLoading } = useOrderList(filters);
  const orders = response?.data || [];
  const pagination = response?.pagination;

  const clearFilters = () => {
    setSearchText('');
    setDateRange(undefined);
    setSelectedStatus(null);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await orderApi.getAll({
        type: 'CAMBIO',
        search: debouncedSearch,
        startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
        page: 1,
        limit: 1000,
      });

      if (response && response.data.length > 0) {
        exportExchangesToExcel(response.data, `Historial_Cambios_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        alert("No hay cambios para exportar con estos filtros");
      }
    } catch (error) {
      console.error("Error exporting exchanges:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const { hasPermission } = useAuth();
  const canCreate = hasPermission('exchanges.create');

  const handleEditBatch = (receiptNumber: string) => {
    navigate(`/exchanges/group/${receiptNumber}`);
  };

  const handleDeleteBatch = async () => {
    if (!deleteData.receiptNumber) return;
    
    try {
      setIsDeleting(true);
      const groupToDelete = groupedOrders.find(g => g[0].receiptNumber === deleteData.receiptNumber);
      if (!groupToDelete) throw new Error("No se encontró el grupo de pedidos");
      
      const referenceId = groupToDelete[0].id;
      
      await orderApi.delete(referenceId, true); // true para cascade por receipt
      
      notifySuccess(`Guía ${deleteData.receiptNumber} eliminada correctamente. Los pedidos originales han vuelto a estado Entregado.`);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error: any) {
      console.error("Error al eliminar guía:", error);
      notifyError(error, error.message || "Error al eliminar la guía de cambio.");
    } finally {
      setIsDeleting(false);
      setDeleteData({ isOpen: false, receiptNumber: null });
    }
  };

  const groupedOrders = React.useMemo(() => {
    const groups: Record<string, Order[]> = {};
    orders.forEach(order => {
      const gId = order.receiptNumber || `temp-${order.id}`;
      if (!groups[gId]) {
        groups[gId] = [];
      }
      groups[gId].push(order);
    });
    return Object.values(groups);
  }, [orders]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Cambios"
        description="Historial y estado de los cambios agrupados por guía de envío"
        icon={Replace}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Button 
                variant="outline" 
                onClick={clearFilters} 
                title="Limpiar todos los filtros" 
                className="w-full sm:w-10 h-10 p-0 rounded-xl flex items-center justify-center gap-2 sm:gap-0"
              >
                 <RotateCcw className="h-4 w-4 text-slate-500" />
                 <span className="sm:hidden font-bold text-slate-500 text-xs">Limpiar Filtros</span>
             </Button>
             <Button 
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full sm:w-auto bg-white hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 gap-2 h-10 rounded-xl px-4 font-bold"
             >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> : <FileDown className="h-4 w-4 text-emerald-500" />}
                {isExporting ? 'Exportando...' : 'Exportar Excel'}
             </Button>
             {canCreate && (
               <Button
                 onClick={() => navigate('/exchanges/new')}
                 className="w-full sm:w-auto bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 h-10 px-6 tracking-wide"
               >
                 <Plus className="h-4 w-4" /> Nuevo Cambio
               </Button>
             )}
          </div>
        }
      />

      <div className="space-y-4">
        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row items-end gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-2">
          <div className="w-full md:flex-1 min-w-[240px]">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Buscar Cliente o Guía</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Nombre, N° de guía..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 h-11 border-slate-200 rounded-xl bg-slate-50 focus:ring-monchito-purple/20 text-sm w-full"
              />
            </div>
          </div>
          <div className="w-full md:w-[220px]">
             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Estado</Label>
             <Select value={selectedStatus || "ALL"} onValueChange={(v) => setSelectedStatus(v === "ALL" ? null : v)}>
               <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700">
                 <SelectValue placeholder="Todos los estados" />
               </SelectTrigger>
               <SelectContent className="rounded-xl border-slate-200">
                 <SelectItem value="ALL" className="font-bold text-slate-500 text-xs uppercase tracking-widest">Todos los estados</SelectItem>
                 <SelectItem value="RECOLECTADO" className="font-bold text-indigo-700 text-xs uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-indigo-600" /> Recolectado
                   </div>
                 </SelectItem>
                 <SelectItem value="EN_TRANSITO" className="font-bold text-sky-700 text-xs uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-sky-500" /> En Tránsito
                   </div>
                 </SelectItem>
                 <SelectItem value="RECIBIDO_EN_BODEGA" className="font-bold text-amber-700 text-xs uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500" /> En Bodega
                   </div>
                 </SelectItem>
                 <SelectItem value="ENTREGADO" className="font-bold text-emerald-700 text-xs uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500" /> Entregado
                   </div>
                 </SelectItem>
                 <SelectItem value="POR_ENVIAR" className="font-bold text-violet-700 text-xs uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-violet-500" /> Enviado Oficina
                   </div>
                 </SelectItem>
               </SelectContent>
             </Select>
           </div>
          <div className="w-full md:w-[240px]">
            <DateRangePicker 
              value={dateRange}
              onChange={setDateRange}
              showLabel={true}
              label="Rango de Fechas"
              className="w-full"
              buttonClassName="h-11 rounded-xl bg-slate-50 border-slate-200"
              labelClassName="!text-[10px] !font-black uppercase tracking-widest !text-slate-400 !mb-1.5 !ml-1"
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
             <div className="h-10 w-10 border-4 border-monchito-purple border-t-transparent rounded-full animate-spin" />
             <p className="text-sm font-bold text-slate-400 animate-pulse">Cargando guías de cambios...</p>
          </div>
        ) : groupedOrders.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white border border-slate-200 rounded-2xl text-slate-300 shadow-sm">
            <div className="p-4 bg-slate-50 rounded-full">
              <ClipboardList className="h-10 w-10" />
            </div>
            <div className="text-center">
              <p className="text-slate-500 font-bold">No se encontraron guías</p>
              <p className="text-xs mt-1">Intenta con otros filtros o registra una nueva guía</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-monchito-purple/10 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="text-sm border-collapse min-w-[1000px] w-full">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                  <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10 text-[10px] uppercase tracking-wider text-monchito-purple font-black whitespace-nowrap">
                    <th className="px-4 py-4 text-center w-12">N°</th>
                    <th className="px-4 py-4 text-left">Cliente</th>
                    <th className="px-4 py-4 text-center">N° de Guía</th>
                    <th className="px-4 py-4 text-center">Fecha</th>
                    <th className="px-4 py-4 text-center">Recolectado</th>
                    <th className="px-4 py-4 text-center">En Tránsito</th>
                    <th className="px-4 py-4 text-center">En Bodega</th>
                    <th className="px-4 py-4 text-center">Entregado</th>
                    <th className="px-4 py-4 text-center w-12">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-monchito-purple/5">
                  {groupedOrders.map((group, idx) => {
                    const first = group[0];
                    const count = group.length;
                    const recolectado = group.filter(o => o.status === 'RECOLECTADO').length;
                    const transito = group.filter(o => o.status === 'EN_TRANSITO').length;
                    const enBodega = group.filter(o => o.status === 'RECIBIDO_EN_BODEGA').length;
                    const entregado = group.filter(o => o.status === 'ENTREGADO').length;
                    const isSN = first.receiptNumber.startsWith('S/N-');
                    const displayReceipt = isSN ? "" : first.receiptNumber;

                    return (
                      <tr 
                        key={first.receiptNumber} 
                        onClick={() => setSelectedGroup(group)}
                        className="hover:bg-monchito-purple/5 transition-all cursor-pointer group-row border-b border-monchito-purple/5 last:border-0"
                      >
                        <td className="px-4 h-[72px] p-0 text-center border-r border-slate-50">
                           <span className="text-xs font-bold text-slate-400">
                               {skipOffset(page, limit) + idx + 1}
                           </span>
                        </td>
                        <td className="px-4 h-[72px] p-0 border-r border-slate-50">
                           <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{first.clientName}</p>
                        </td>
                        <td className="px-4 h-[72px] p-0 border-r border-slate-50 text-center" onClick={(e) => e.stopPropagation()}>
                           {editingReceipt === first.receiptNumber ? (
                             <div className="flex items-center gap-1 justify-center">
                               <Input 
                                 size={1}
                                 className="h-8 w-32 text-[10px] font-black font-mono border-monchito-purple focus:ring-monchito-purple/20"
                                 value={editValue}
                                 onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                                 autoFocus
                                 disabled={isRenaming}
                                 onKeyDown={async (e) => {
                                   if (e.key === 'Enter') {
                                     if (!editValue || editValue.trim() === "") return;
                                     setIsRenaming(true);
                                     try {
                                       await orderApi.renameReceipt(first.receiptNumber, editValue.trim());
                                       notifySuccess("Guía actualizada correctamente");
                                       queryClient.invalidateQueries({ queryKey: ['orders'] });
                                       setEditingReceipt(null);
                                     } catch (err: any) {
                                       notifyError(err, err.message || "Error al renombrar guía");
                                     } finally {
                                       setIsRenaming(false);
                                     }
                                   } else if (e.key === 'Escape') {
                                     setEditingReceipt(null);
                                   }
                                 }}
                               />
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-slate-400 hover:text-red-500"
                                 onClick={() => setEditingReceipt(null)}
                               >
                                 <X className="h-4 w-4" />
                               </Button>
                             </div>
                           ) : (
                             <div className="flex items-center justify-center gap-2 group-hover-actions">
                               <span className={`text-xs font-black tracking-tight ${isSN ? 'text-slate-300' : 'text-slate-700'}`}>
                                 {displayReceipt || 'SIN NÚMERO'}
                               </span>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-6 w-6 text-slate-300 hover:text-monchito-purple opacity-0 group-hover:opacity-100 transition-opacity"
                                 onClick={() => {
                                   setEditingReceipt(first.receiptNumber);
                                   setEditValue(isSN ? "" : first.receiptNumber);
                                 }}
                               >
                                 <Edit2 className="h-3.5 w-3.5" />
                               </Button>
                             </div>
                           )}
                        </td>
                        <td className="px-4 h-[72px] p-0 border-r border-slate-50 text-center">
                           <span className="text-xs font-semibold text-slate-600">
                               {fmtDate(first.createdAt).split(' ')[0]}
                           </span>
                        </td>
                        <td className="px-4 h-[72px] p-0 border-r border-slate-50 text-center group/td relative">
                             <div className="flex items-center justify-center h-full w-full">
                                <div className={`flex items-center justify-center min-w-[64px] h-11 px-3 rounded-full transition-all duration-200 group-hover/td:opacity-0 group-hover/td:scale-50 ${recolectado > 0 ? 'bg-indigo-600 shadow-lg shadow-indigo-100 scale-110 font-black text-white' : 'bg-slate-100/50 text-slate-300 font-bold'}`}>
                                    {recolectado}
                                </div>
                                 {(transito === 0 && enBodega === 0 && entregado === 0) && (
                                     <button
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             navigate(`/exchanges/group/${first.receiptNumber}`);
                                         }}
                                         className="absolute inset-0 m-auto w-28 h-10 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl opacity-0 scale-50 group-hover/td:opacity-100 group-hover/td:scale-100 transition-all duration-200 shadow-xl shadow-indigo-200 flex items-center justify-center gap-1.5 z-10"
                                     >
                                         <Plus className="h-3 w-3" /> Agregar más
                                     </button>
                                 )}
                             </div>
                        </td>
                        <td className="px-4 h-[72px] p-0 border-r border-slate-50 text-center">
                            <div className="flex items-center justify-center h-full">
                                <div className={`flex items-center justify-center min-w-[64px] h-11 px-3 rounded-full transition-all ${transito > 0 ? 'bg-sky-500 shadow-lg shadow-sky-100 scale-110 font-black text-white' : 'bg-slate-100/50 text-slate-300 font-bold'}`}>
                                      {transito}
                                </div>
                            </div>
                        </td>
                        <td className="px-4 h-[72px] p-0 border-r border-slate-50 text-center">
                            <div className="flex items-center justify-center h-full">
                                <div className={`flex items-center justify-center min-w-[64px] h-11 px-3 rounded-full transition-all ${enBodega > 0 ? 'bg-amber-500 shadow-lg shadow-amber-100 scale-110 font-black text-white' : 'bg-slate-100/50 text-slate-300 font-bold'}`}>
                                      <span className="text-[10px] whitespace-nowrap">{enBodega} de {count}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 h-[72px] p-0 border-r border-slate-50 text-center">
                            <div className="flex items-center justify-center h-full">
                                <div className={`flex items-center justify-center min-w-[64px] h-11 px-3 rounded-full transition-all ${entregado > 0 ? 'bg-emerald-500 shadow-lg shadow-emerald-100 scale-110 font-black text-white' : 'bg-slate-100/50 text-slate-300 font-bold'}`}>
                                      <span className="text-[10px] whitespace-nowrap">{entregado} de {count}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 h-[72px] p-0 text-center">
                          <div className="flex justify-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-monchito-purple hover:bg-monchito-purple/10 transition-colors">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination && pagination.pages > 1 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.pages}
                        onPageChange={setPage}
                        totalItems={pagination.total}
                        itemsPerPage={limit}
                    />
                </div>
            )}
          </div>
        )}
      </div>
      
      {/* Detail Modal Configured to look like Registro de Ventas */}
      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col rounded-3xl p-0 gap-0 border-none shadow-2xl">
          {selectedGroup && (() => {
               const firstOrder = selectedGroup[0];
               const batchInfo = (firstOrder as any).exchangeBatchItems?.[0]?.batch;
               const totalAmount = selectedGroup.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
               const isAnyDelivered = selectedGroup.some(o => o.status === 'ENTREGADO');
               const isAllDelivered = selectedGroup.every(o => o.status === 'ENTREGADO');
               const isAllBodega = selectedGroup.every(o => o.status === 'RECIBIDO_EN_BODEGA' || o.status === 'ENTREGADO');
               let globalStatus = 'Diversos';
               if (isAllDelivered) globalStatus = 'ENTREGADO';
               else if (isAllBodega) globalStatus = 'RECIBIDO_EN_BODEGA';
               else if (selectedGroup.every(o => o.status === 'EN_TRANSITO')) globalStatus = 'EN_TRANSITO';
               else if (selectedGroup.every(o => o.status === 'RECOLECTADO')) globalStatus = 'RECOLECTADO';
               else if (selectedGroup.every(o => o.status === 'POR_ENVIAR')) globalStatus = 'POR_ENVIAR';
               else if (selectedGroup.every(o => o.status === 'POR_RECIBIR')) globalStatus = 'POR_RECIBIR';

               return (
            <>
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase text-monchito-purple tracking-widest mb-1">Registro de Cambios</p>
                            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Guía {firstOrder.receiptNumber}</DialogTitle>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge className={`${STATUS_COLORS[globalStatus] || 'bg-slate-100 text-slate-700'} border font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full shadow-sm`}>
                                {STATUS_LABELS[globalStatus] || globalStatus}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground font-medium italic mt-1">Canal: {firstOrder.salesChannel}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-6 bg-slate-50/50">
                    {/* Global Summary Card Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente</p>
                            <p className="font-bold text-slate-800 truncate">{firstOrder.clientName}</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase">Items: <span className="font-black text-monchito-purple">{selectedGroup.length}</span></p>
                        </div>

                        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Estado General</p>
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-xs text-slate-500 font-semibold">Recolectados:</span>
                                <span className="font-black text-indigo-600">{selectedGroup.filter(o => o.status === 'RECOLECTADO').length}</span>
                            </div>
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-xs text-slate-500 font-semibold">En Tránsito:</span>
                                <span className="font-black text-sky-600">{selectedGroup.filter(o => o.status === 'EN_TRANSITO').length}</span>
                            </div>
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-xs text-slate-500 font-semibold">En Bodega:</span>
                                <span className="font-black text-amber-600">{selectedGroup.filter(o => o.status === 'RECIBIDO_EN_BODEGA').length}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs text-slate-500 font-semibold">Entregados:</span>
                                <span className="font-black text-emerald-600">{selectedGroup.filter(o => o.status === 'ENTREGADO').length}</span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Registro</p>
                            <p className="font-bold text-slate-700 text-sm leading-tight">{fmtDate(firstOrder.createdAt).split(' ')[0]}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Recepción bod.</p>
                            <p className="font-bold text-amber-700 text-[11px] leading-tight">{firstOrder.receptionDate ? fmtDate(firstOrder.receptionDate).split(' ')[0] : 'Pendiente'}</p>
                        </div>

                        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gestionado por</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-8 h-8 rounded-full bg-monchito-purple/10 text-monchito-purple border border-monchito-purple/20 flex items-center justify-center text-xs font-black">
                                    {(firstOrder.createdByName || 'U').charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 text-sm truncate">{firstOrder.createdByName || 'S/N'}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Vendedor</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Associated Orders Table */}
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-3 border-b-2 border-monchito-purple/10 pb-2">
                            <div className="flex items-center gap-2">
                                <ListOrdered className="w-5 h-5 text-monchito-purple" />
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Desglose de la Guía</h4>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight mb-1">Total de Guía</p>
                                <p className="text-3xl font-black text-monchito-purple leading-none">{formatCurrency(totalAmount)}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xl">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-xs text-left border-collapse min-w-[1400px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                                            <th className="px-4 py-4 border-r border-slate-100 text-center" colSpan={4}>Información de lo que se Devuelve (Original)</th>
                                            <th className="px-2 w-8 text-center text-slate-300 border-r border-slate-100">
                                               <ArrowRightLeft className="w-3 h-3 mx-auto" />
                                            </th>
                                            <th className="px-4 py-4 border-r border-slate-100 text-center" colSpan={6}>Información del Reemplazo Solicitado (Cambio)</th>
                                        </tr>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase font-black text-slate-400 bg-slate-100/30">
                                            {/* Original */}
                                            <th className="px-4 py-3 border-r border-slate-100 w-28 text-slate-500">N° Pedido</th>
                                            <th className="px-4 py-3 border-r border-slate-100 text-center w-12 text-slate-500">Cant</th>
                                            <th className="px-4 py-3 border-r border-slate-100 w-28 text-slate-500">Catálogo</th>
                                            <th className="px-4 py-3 border-r border-slate-100 min-w-[200px] text-slate-500">Descripción del Cambio</th>
                                            {/* Middle */}
                                            <th className="px-2 text-center border-r border-slate-100 bg-slate-50"></th>
                                            {/* New */}
                                            <th className="px-4 py-3 border-r border-slate-100 w-28 text-monchito-purple/70">Pedido por</th>
                                            <th className="px-4 py-3 border-r border-slate-100 text-center w-12 text-monchito-purple/70">Cant</th>
                                            <th className="px-4 py-3 border-r border-slate-100 w-28 text-monchito-purple/70">Catálogo</th>
                                            <th className="px-4 py-3 border-r border-slate-100 min-w-[200px] text-monchito-purple/70">Descripción</th>
                                            <th className="px-4 py-3 border-r border-slate-100 w-28 text-center text-monchito-purple/70">Entrega</th>
                                            <th className="px-4 py-3 text-center w-28 text-monchito-purple/70">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {selectedGroup.map((child) => {
                                            const parsed = parseExchangeNotesDetailed(child.notes || '');
                                            return (
                                            <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                                                {/* Original Info */}
                                                <td className="px-4 py-4 font-black text-slate-400 border-r border-slate-100">{parsed.originalOrder}</td>
                                                <td className="px-4 py-4 text-center font-black text-slate-500 border-r border-slate-100 bg-slate-50/50">{parsed.originalQty}</td>
                                                <td className="px-4 py-4 font-bold text-slate-700 border-r border-slate-100">{parsed.originalBrand}</td>
                                                <td className="px-4 py-4 font-medium text-slate-600 border-r border-slate-100">
                                                    <p className="line-clamp-2" title={parsed.originalDesc}>{parsed.originalDesc}</p>
                                                </td>
                                                
                                                <td className="px-2 py-4 text-center text-slate-300 border-r border-slate-100 bg-slate-50/50">
                                                    <ArrowRightLeft className="w-4 h-4 mx-auto text-monchito-purple/30" />
                                                </td>
                                                
                                                {/* Replacement Info */}
                                                <td className="px-4 py-4 font-black text-slate-800 border-r border-slate-100">
                                                   <Badge variant="outline" className="text-[9px] w-full justify-center px-1 py-0.5 uppercase font-black text-slate-500 border-slate-200">
                                                     {child.salesChannel}
                                                   </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-center font-black text-monchito-purple border-r border-slate-100 bg-monchito-purple/5">{parsed.newQty}</td>
                                                <td className="px-4 py-4 font-bold text-monchito-purple border-r border-slate-100">{parsed.newBrand}</td>
                                                <td className="px-4 py-4 font-bold text-monchito-purple border-r border-slate-100">
                                                    <p className="line-clamp-2" title={parsed.newDesc}>{parsed.newDesc}</p>
                                                </td>
                                                <td className="px-4 py-4 text-center font-bold text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                                    {child.possibleDeliveryDate ? fmtDate(child.possibleDeliveryDate).split(' ')[0] : 'N/A'}
                                                </td>
                                                
                                                <td className="px-4 py-4 text-center">
                                                    <Badge className={`${STATUS_COLORS[child.status] || 'bg-slate-100 text-slate-700'} border font-black uppercase text-[8px] tracking-widest px-2 py-1 rounded-xl shadow-sm`}>
                                                        {STATUS_LABELS[child.status] || child.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="flex gap-2">
                        {batchInfo?.status === 'POR_ENVIAR' && hasPermission('exchanges.manage') && (
                            <Button 
                                className="rounded-xl h-11 font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all px-8 shadow-md"
                                onClick={() => handleStartShipment(batchInfo.id)}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Enviar a Proveedor
                            </Button>
                        )}

                        {batchInfo?.status === 'EN_TRANSITO' && hasPermission('exchanges.manage') && (
                            <Button 
                                className="rounded-xl h-11 font-black bg-amber-600 hover:bg-amber-700 text-white transition-all px-8 shadow-md"
                                onClick={() => handleStatusUpdate(batchInfo.id, 'EN_BODEGA')}
                                disabled={isUpdatingStatus}
                            >
                                <PackageOpen className="w-4 h-4 mr-2" />
                                Recibir en Bodega
                            </Button>
                        )}

                        {!isAnyDelivered && hasPermission('exchanges.edit') && (
                            <Button 
                                variant="outline" 
                                className="rounded-xl h-11 font-bold text-monchito-purple border-monchito-purple/20 hover:bg-monchito-purple/5 transition-all px-6"
                                onClick={() => handleEditBatch(firstOrder.receiptNumber!)}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Guía
                            </Button>
                        )}
                        {!isAnyDelivered && hasPermission('exchanges.delete') && (
                            <Button 
                                variant="ghost" 
                                className="rounded-xl h-11 font-bold text-red-500 hover:bg-red-50 transition-all px-6"
                                onClick={() => setDeleteData({ isOpen: true, receiptNumber: firstOrder.receiptNumber! })}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar Todo
                            </Button>
                        )}
                        {isAnyDelivered && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <AlertTriangle className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Guía con items entregados (Restringida)</span>
                            </div>
                        )}
                    </div>
                    <Button 
                        variant="default" 
                        className="rounded-xl h-11 font-black bg-slate-900 hover:bg-slate-800 text-white transition-all px-8 shadow-lg w-full sm:w-auto"
                        onClick={() => setSelectedGroup(null)}
                    >
                        Cerrar Detalles
                    </Button>
                </DialogFooter>
            </>
          );})()}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={shipmentData.isOpen}
        onOpenChange={(open) => !open && setShipmentData({ ...shipmentData, isOpen: false })}
        title="Enviar Lote a Proveedor"
        description="Ingresa el número de guía de envío para este lote de cambios. Este número será visible para el seguimiento de los pedidos."
        confirmText={isUpdatingStatus ? "Enviando..." : "Registrar Envío"}
        cancelText="Cancelar"
        onConfirm={() => {
            if (!shipmentData.trackingGuide) {
                notifyError("Debes ingresar el número de guía");
                return;
            }
            handleStatusUpdate(shipmentData.batchId!, 'EN_TRANSITO', shipmentData.trackingGuide);
        }}
      >
        <div className="mt-4">
            <Label htmlFor="trackingGuide" className="text-[10px] font-black text-slate-400 uppercase mb-2 block">N° de Guía / Tracking</Label>
            <Input 
                id="trackingGuide"
                placeholder="Ej: SERV-123456"
                autoFocus
                value={shipmentData.trackingGuide}
                onChange={(e) => setShipmentData({ ...shipmentData, trackingGuide: e.target.value.toUpperCase() })}
                className="rounded-xl h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-bold"
            />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteData.isOpen}
        onOpenChange={(open) => !open && setDeleteData({ isOpen: false, receiptNumber: null })}
        title="Eliminar Guía de Cambio"
        description={`¿Estás seguro de que deseas eliminar la guía ${deleteData.receiptNumber}? Esto eliminará todos los cambios solicitados y revertirá los pedidos originales al estado "Entregado". Esta acción no se puede deshacer.`}
        confirmText={isDeleting ? "Eliminando..." : "Sí, eliminar guía"}
        cancelText="No, mantener"
        onConfirm={handleDeleteBatch}
        variant="destructive"
      />
    </div>
  );
}

const skipOffset = (page: number, limit: number) => (page - 1) * limit;
