import { useState } from 'react';
import { Search, Trophy, Clock, CheckCircle2, History } from 'lucide-react';
import { useLoyaltyBalances, useLoyaltyRedemptions } from '../model/hooks';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Pagination } from '@/shared/ui/pagination';
import { useDebounce } from '@/shared/lib/hooks';
import { useNotifications } from '@/shared/lib/notifications';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export function LoyaltySummary() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebounce(search, 500);
    const { notifySuccess, notifyError } = useNotifications();

    const { balances, pagination, isLoading, refetch } = useLoyaltyBalances({
        page,
        limit: 10,
        search: debouncedSearch
    });

    const { redeemPrize, isRedeeming } = useLoyaltyRedemptions();

    const handleRedeem = async (clientId: string, ruleId: string) => {
        try {
            await redeemPrize({ clientId, ruleId });
            notifySuccess("¡Canje realizado con éxito!");
            refetch();
        } catch (error) {
            notifyError(error, "Error al procesar el canje");
        }
    };

    return (
        <div className="space-y-6">
            {/* Minimalist KPI Header */}
            <div className="bg-monchito-purple/5 border border-monchito-purple/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-monchito-purple/10 flex items-center justify-center text-monchito-purple">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-monchito-purple font-black uppercase text-xs tracking-[0.2em]">Clientes en Programas</h3>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{pagination?.total || 0}</p>
                    </div>
                </div>
                
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar cliente por nombre o cédula..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-11 border-white shadow-sm bg-white/80 font-medium rounded-xl focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Table-based Client List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow>
                            <TableHead className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Empresaria / Cliente</TableHead>
                            <TableHead className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Programas Activos y Progreso</TableHead>
                            <TableHead className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <TableRow key={i}>
                                    <TableCell colSpan={3} className="px-6 py-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell>
                                </TableRow>
                            ))
                        ) : balances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="py-24 text-center">
                                    <Trophy className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">No se encontraron clientes con resultados</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            balances.map((client: any) => (
                                <TableRow key={client.id} className="group hover:bg-slate-50/30 transition-colors border-b border-slate-50 last:border-0 grow">
                                    <TableCell className="px-6 py-5 align-top w-[300px]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold border border-slate-800 shadow-md">
                                                {client.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-800 uppercase leading-none mb-1.5">{client.name}</div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200 uppercase tracking-tighter">
                                                        {client.idNumber}
                                                    </Badge>
                                                    <span className="text-[10px] text-monchito-purple font-black uppercase tracking-widest">
                                                        {client.rules.length} PROG.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-top">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
                                            {client.rules.map((rule: any) => (
                                                <div 
                                                    key={rule.ruleId} 
                                                    className={`p-3 rounded-xl border transition-all ${
                                                        rule.canRedeem 
                                                            ? 'border-emerald-200 bg-emerald-50/50' 
                                                            : 'border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="truncate pr-2">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{rule.ruleName}</p>
                                                            <h5 className="font-bold text-slate-700 text-xs truncate">{rule.prizeName || 'Meta Fidelidad'}</h5>
                                                        </div>
                                                        {rule.canRedeem && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${rule.canRedeem ? 'bg-emerald-500' : 'bg-monchito-purple'}`}
                                                                style={{ width: `${Math.min(rule.progress, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {rule.expiringDays ? `Vence ${rule.expiringDays}d` : 'No vence'}
                                                            </div>
                                                            <div className="text-[10px] text-right">
                                                                {rule.canRedeem ? (
                                                                    <Button 
                                                                        size="sm" 
                                                                        onClick={() => handleRedeem(client.id, rule.ruleId)}
                                                                        disabled={isRedeeming}
                                                                        className="h-6 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[8px] rounded-lg shadow-sm"
                                                                    >
                                                                        RECLAMAR
                                                                    </Button>
                                                                ) : (
                                                                    <span className="font-black text-slate-700 tracking-tighter">
                                                                        {rule.current} / {rule.target}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-top text-right">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:text-monchito-purple hover:bg-monchito-purple/5">
                                            <History className="h-5 w-5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Sticky Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex justify-end pt-2">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.pages}
                        onPageChange={setPage}
                        totalItems={pagination.total}
                        itemsPerPage={10}
                    />
                </div>
            )}
        </div>
    );
}