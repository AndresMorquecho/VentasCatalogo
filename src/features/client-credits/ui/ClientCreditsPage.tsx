import { useState, useEffect } from "react";
import { useClientCredits } from "../model/hooks";
import { ClientCreditsTable } from "./ClientCreditsTable";
import { Input } from "@/shared/ui/input";
import { Search, Gift, DollarSign } from "lucide-react";
import { useDebounce } from "@/shared/lib/hooks";
import { PageHeader } from "@/shared/ui/PageHeader";

import { Pagination } from "@/shared/ui/pagination";

export function ClientCreditsPage() {
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebounce(searchText, 1000);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Reset page when search changes
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const { summaries: credits, pagination, isLoading } = useClientCredits({
        page,
        limit,
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined
    });

    // Local filter for short search terms (<3 chars)
    const filteredCredits = credits.filter((credit: any) => {
        if (debouncedSearch.length > 0 && debouncedSearch.length < 3) {
            const s = debouncedSearch.toLowerCase();
            return credit.clientName?.toLowerCase().includes(s) || credit.clientId.toLowerCase().includes(s);
        }
        return true;
    });

    // Calculate total credits
    const totalCredits = filteredCredits.reduce((sum: number, c: any) => sum + Number(c.totalCredit), 0);

    if (isLoading) return <div className="p-8">Cargando saldos a favor...</div>;


    return (
        <div className="space-y-6">
            <PageHeader 
                title="Saldos a Favor" 
                description="Créditos disponibles de clientes para futuros pedidos"
                icon={Gift}
            />

            <div className="bg-white px-5 py-3 rounded-xl border border-emerald-100 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.3)] flex items-center gap-3 min-w-[220px]">
                <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-slate-500 text-[11px] font-semibold mb-0.5">Total Saldos a Favor</p>
                    <p className="text-xl font-bold text-slate-800 tracking-tight leading-none">${totalCredits.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6 flex flex-wrap gap-4 items-end">
                <div className="w-full md:w-64">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar Cliente</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Nombre o ID..."
                            className="pl-9"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>
                <div className="text-sm text-muted-foreground">
                    {filteredCredits.length} cliente{filteredCredits.length !== 1 ? 's' : ''} con saldo a favor
                </div>
            </div>

            <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <ClientCreditsTable credits={filteredCredits} />
            </div>

            {pagination && (
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            )}

        </div>
    );
}
