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
  ListOrdered
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
import type { Order } from '@/entities/order/model/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../shared/ui/dialog';

const STATUS_LABELS: Record<string, string> = {
  POR_RECIBIR: 'Enviado',
  RECIBIDO_EN_BODEGA: 'En Bodega',
  ENTREGADO: 'Entregado al Cliente',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
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
  const limit = 50; // Increased limit so groups display correctly
  
  const [selectedGroup, setSelectedGroup] = useState<Order[] | null>(null);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateRange]);

  const filters = {
    type: 'CAMBIO',
    search: debouncedSearch,
    startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
    endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
    page,
    limit,
  };

  const { data: response, isLoading } = useOrderList(filters);
  const orders = response?.data || [];
  const pagination = response?.pagination;

  const clearFilters = () => {
    setSearchText('');
    setDateRange(undefined);
    setPage(1);
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
          <div className="flex gap-3">
             <Button variant="outline" onClick={clearFilters} title="Limpiar todos los filtros" className="h-10 w-10 p-0 rounded-xl">
                 <RotateCcw className="h-4 w-4 text-slate-500" />
             </Button>
             <Button
               onClick={() => navigate('/exchanges/new')}
               className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black rounded-xl shadow-lg transition-all flex items-center gap-2 h-10 px-6 tracking-wide"
             >
               <Plus className="h-4 w-4" /> Nuevo Cambio
             </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row items-end gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-2">
          <div className="w-full md:flex-1 min-w-[280px]">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Buscar Cliente o Guía</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Nombre, N° de guía, descripción..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 h-11 border-slate-200 rounded-xl bg-slate-50 focus:ring-monchito-purple/20 text-sm w-full"
              />
            </div>
          </div>
          <div className="w-full md:w-[320px]">
            <DateRangePicker 
              value={dateRange}
              onChange={setDateRange}
              showLabel={true}
              label="Rango de Fechas (Registro)"
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
                    <th className="px-4 py-4 text-center">Enviado</th>
                    <th className="px-4 py-4 text-center">En Bodega</th>
                    <th className="px-4 py-4 text-center">Recibido</th>
                    <th className="px-4 py-4 text-center w-12">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-monchito-purple/5">
                  {groupedOrders.map((group, idx) => {
                    const first = group[0];
                    const count = group.length;
                    const enviado = group.filter(o => o.status === 'POR_RECIBIR').length;
                    const enBodega = group.filter(o => o.status === 'RECIBIDO_EN_BODEGA').length;
                    const entregado = group.filter(o => o.status === 'ENTREGADO').length;

                    return (
                      <tr 
                        key={first.receiptNumber} 
                        onClick={() => setSelectedGroup(group)}
                        className="hover:bg-monchito-purple/5 transition-all cursor-pointer group-row border-b border-monchito-purple/5 last:border-0"
                      >
                        <td className="px-4 py-5 text-center border-r border-slate-50">
                           <span className="text-xs font-bold text-slate-400">
                               {skipOffset(page, limit) + idx + 1}
                           </span>
                        </td>
                        <td className="px-4 py-5 border-r border-slate-50">
                           <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{first.clientName}</p>
                        </td>
                        <td className="px-4 py-5 border-r border-slate-50 text-center">
                           <Badge variant="outline" className="text-[10px] font-black font-mono px-2 py-0.5 border-monchito-purple/20 text-monchito-purple uppercase tracking-widest bg-monchito-purple/5 rounded">
                             {first.receiptNumber}
                           </Badge>
                        </td>
                        <td className="px-4 py-5 border-r border-slate-50 text-center">
                           <span className="text-xs font-semibold text-slate-600">
                               {fmtDate(first.createdAt).split(' ')[0]}
                           </span>
                        </td>
                        <td className="px-4 py-5 border-r border-slate-50 text-center">
                           <span className={`text-xs font-bold ${enviado > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                             {enviado} de {count}
                           </span>
                        </td>
                        <td className="px-4 py-5 border-r border-slate-50 text-center">
                           <span className={`text-xs font-bold ${enBodega > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                             {enBodega} de {count}
                           </span>
                        </td>
                        <td className="px-4 py-5 border-r border-slate-50 text-center">
                           <span className={`text-xs font-bold ${entregado > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                             {entregado} de {count}
                           </span>
                        </td>
                        <td className="px-4 py-5 text-center">
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
               const totalAmount = selectedGroup.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
               const isAllDelivered = selectedGroup.every(o => o.status === 'ENTREGADO');
               const isAllBodega = selectedGroup.every(o => o.status === 'RECIBIDO_EN_BODEGA');
               let globalStatus = 'Diversos';
               if (isAllDelivered) globalStatus = 'ENTREGADO';
               else if (isAllBodega) globalStatus = 'RECIBIDO_EN_BODEGA';
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
                                <span className="text-xs text-slate-500 font-semibold">Enviados:</span>
                                <span className="font-black text-blue-600">{selectedGroup.filter(o => o.status === 'POR_RECIBIR').length}</span>
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
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total del Recibo</p>
                                <p className="text-2xl font-black text-monchito-purple leading-none">{formatCurrency(totalAmount)}</p>
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
                                                <td className="px-4 py-5 font-black text-slate-400 border-r border-slate-100">{parsed.originalOrder}</td>
                                                <td className="px-4 py-5 text-center font-black text-slate-500 border-r border-slate-100 bg-slate-50/50">{parsed.originalQty}</td>
                                                <td className="px-4 py-5 font-bold text-slate-700 border-r border-slate-100">{parsed.originalBrand}</td>
                                                <td className="px-4 py-5 font-medium text-slate-600 border-r border-slate-100">
                                                    <p className="line-clamp-2" title={parsed.originalDesc}>{parsed.originalDesc}</p>
                                                </td>
                                                
                                                <td className="px-2 py-5 text-center text-slate-300 border-r border-slate-100 bg-slate-50/50">
                                                    <ArrowRightLeft className="w-4 h-4 mx-auto text-monchito-purple/30" />
                                                </td>
                                                
                                                {/* Replacement Info */}
                                                <td className="px-4 py-5 font-black text-slate-800 border-r border-slate-100">
                                                   <Badge variant="outline" className="text-[9px] w-full justify-center px-1 py-0.5 uppercase font-black text-slate-500 border-slate-200">
                                                     {child.salesChannel}
                                                   </Badge>
                                                </td>
                                                <td className="px-4 py-5 text-center font-black text-monchito-purple border-r border-slate-100 bg-monchito-purple/5">{parsed.newQty}</td>
                                                <td className="px-4 py-5 font-bold text-monchito-purple border-r border-slate-100">{parsed.newBrand}</td>
                                                <td className="px-4 py-5 font-bold text-monchito-purple border-r border-slate-100">
                                                    <p className="line-clamp-2" title={parsed.newDesc}>{parsed.newDesc}</p>
                                                </td>
                                                <td className="px-4 py-5 text-center font-bold text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                                    {child.possibleDeliveryDate ? fmtDate(child.possibleDeliveryDate).split(' ')[0] : 'N/A'}
                                                </td>
                                                
                                                <td className="px-4 py-5 text-center">
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

                <DialogFooter className="px-6 py-4 bg-white border-t border-slate-100 justify-end">
                    <Button 
                        variant="outline" 
                        className="rounded-xl h-11 font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 px-8 shadow-sm"
                        onClick={() => setSelectedGroup(null)}
                    >
                        Cerrar Detalles
                    </Button>
                </DialogFooter>
            </>
          );})()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const skipOffset = (page: number, limit: number) => (page - 1) * limit;
