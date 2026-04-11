import { useState, useEffect } from 'react';
import { useLoyaltyRedemptions } from '../model/hooks';
import type { RedemptionStatus } from '../model/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Pagination } from '@/shared/ui/pagination';
import { Calendar, User, Gift, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { DateRangePicker } from '@/shared/ui/filters';
import type { DateRange } from 'react-day-picker';
import { useDebounce } from '@/shared/lib/hooks';
import { useBrandList } from '@/features/brands/api/hooks';

const STATUS_STYLES: Record<RedemptionStatus, { color: string; icon: any }> = {
    COMPLETADO: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    PENDIENTE: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    CANCELADO: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

export function LoyaltyRedemptions() {
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [searchText, setSearchText] = useState('');
    const debouncedSearch = useDebounce(searchText, 500);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [brandId, setBrandId] = useState('ALL');

    const brandResponse = useBrandList();
    const brands = brandResponse.data?.data || [];

    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : '';
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : '';

    // Reset page on filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, startDate, endDate, brandId]);

    const filters = {
        page,
        limit,
        search: debouncedSearch,
        startDate,
        endDate,
        brandId
    };

    const { redemptions, pagination, isLoading } = useLoyaltyRedemptions(filters);

    if (isLoading && !redemptions.length) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Historial de Canjes</h2>
                    <p className="text-sm text-slate-500">Consulta todos los beneficios reclamados por tus clientes.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-indigo-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1 block mb-1">Buscar Cliente</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre d cliente..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1 block mb-1">Marca (Reglas Aplicadas)</label>
                    <Select value={brandId} onValueChange={setBrandId}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                            <SelectValue placeholder="Todas las marcas" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="ALL">Todas las marcas</SelectItem>
                            {brands.map((b: any) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        label="Rango de Fechas"
                        placeholder="Filtrar por fecha..."
                        buttonClassName="h-11 border-slate-200 bg-slate-50 hover:bg-slate-100 w-full"
                        labelClassName="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1 block mb-1"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100">
                            <TableHead className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-widest">Cliente y Canje</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-widest">Premio</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-widest text-center">Inversión</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-widest">Detalles</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-widest text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {redemptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                                    No se han realizado canjes recientemente.
                                </TableCell>
                            </TableRow>
                        ) : (
                            redemptions.map(r => {
                                const StatusIcon = STATUS_STYLES[r.status]?.icon || Clock;
                                return (
                                    <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 grow">
                                        <TableCell className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold border border-slate-800">
                                                    {(r.clientName || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-none mb-1">{r.clientName || 'Cliente sin nombre'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <User className="h-3 w-3" /> {(r.clientId || 'N/A').slice(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <Gift className="h-3.5 w-3.5 text-indigo-500" />
                                                    {r.prizeName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-medium italic mt-0.5">#{r.id.slice(0, 6)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5 text-center">
                                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 rounded-lg text-xs font-bold px-2 py-0.5">
                                                {r.ruleType === 'POR_MONTO' ? `$${Number(r.pointsUsed).toFixed(2)}` : `${r.pointsUsed} pedidos`}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {new Date(r.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] text-slate-400 leading-none">Autor: {r.authorName || 'Auto-Canje'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5 text-right">
                                            <Badge className={`rounded-xl border pl-1.5 pr-2.5 py-1 text-[10px] font-bold inline-flex items-center gap-1.5 ${STATUS_STYLES[r.status]?.color}`}>
                                                <StatusIcon className="h-3 w-3" />
                                                {r.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-2 px-6">
                    <p className="text-xs text-slate-400 font-medium">Mostrando {redemptions.length} de {pagination.total} registros</p>
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
    );
}
