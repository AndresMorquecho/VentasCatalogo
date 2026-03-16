import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../api/walletApi";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/shared/ui/badge";
import { Search, Clock } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { useDebounce } from "@/shared/lib/hooks";
import { Pagination } from "@/shared/ui/pagination";

export function WalletHistory() {
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebounce(searchText, 1000);
    const [page, setPage] = useState(1);
    const [limit] = useState(15);

    const { data: response, isLoading, error } = useQuery<any>({
        queryKey: ["wallet-recharges-history", debouncedSearch, page],
        queryFn: () => walletApi.getRecharges({
            search: debouncedSearch,
            page,
            limit
        })
    });

    if (error) console.error('[WalletHistory] Query error:', error);

    const recharges = response?.data || [];
    const pagination = response?.pagination;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VALIDADO':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">VALIDADO</Badge>;
            case 'PENDIENTE_VALIDACION':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">PENDIENTE</Badge>;
            case 'RECHAZADO':
                return <Badge className="bg-red-100 text-red-700 border-red-200">RECHAZADO</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por cliente o referencia..."
                        className="pl-9 h-9 border-slate-200 bg-white"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                    {pagination?.total || 0} registros encontrados
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-3 text-left">Fecha</th>
                            <th className="px-4 py-3 text-left">Cliente</th>
                            <th className="px-4 py-3 text-left">Método / Ref</th>
                            <th className="px-4 py-3 text-right">Monto</th>
                            <th className="px-4 py-3 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            [1,2,3].map(i => <tr key={i}><td colSpan={5} className="p-8 text-center animate-pulse">Cargando...</td></tr>)
                        ) : recharges.length > 0 ? (
                            recharges.map((r: any) => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-700">
                                            {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: es })}
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" /> {format(new Date(r.createdAt), "HH:mm")}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-black text-slate-700 uppercase">{r.client?.firstName}</div>
                                        <div className="text-[10px] text-slate-400 font-mono italic">{r.client?.identificationNumber}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                                            <Badge variant="outline" className="text-[9px] px-1 h-4">{r.paymentMethod}</Badge>
                                            <span className="font-mono">{r.reference || '—'}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                            {r.bankAccount?.bankName || 'Ajuste Manual'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="font-black text-slate-800">${Number(r.amount).toFixed(2)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-center gap-1">
                                            {getStatusBadge(r.status)}
                                            {r.status === 'RECHAZADO' && r.rejectionReason && (
                                                <span className="text-[9px] text-red-500 font-medium italic max-w-[100px] truncate" title={r.rejectionReason}>
                                                    "{r.rejectionReason}"
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                                    No se encontraron registros en el historial
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.pages > 1 && (
                <div className="flex justify-end pt-2">
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
