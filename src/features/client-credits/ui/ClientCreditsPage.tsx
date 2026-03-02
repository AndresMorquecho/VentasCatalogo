import { useState } from "react";
import { useClientCredits } from "../model/hooks";
import { ClientCreditsTable } from "./ClientCreditsTable";
import { Gift, DollarSign } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";

export function ClientCreditsPage() {
    const [searchText, setSearchText] = useState("");
    const { data: credits = [], isLoading, isError } = useClientCredits();

    // Filter by client name or ID
    const filteredCredits = credits.filter(credit => {
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        return (
            credit.clientName?.toLowerCase().includes(search) ||
            credit.clientId.toLowerCase().includes(search)
        );
    });

    const totalCredits = filteredCredits.reduce((sum, c) => sum + Number(c.totalCredit), 0);

    if (isLoading) return <div className="p-8">Cargando saldos a favor...</div>;
    if (isError) return <div className="p-8 text-red-500">Error al cargar saldos a favor.</div>;

    return (
        <div className="space-y-4">
            <PageHeader
                title="Saldos a Favor"
                description="Créditos disponibles de clientes para futuros pedidos"
                icon={Gift}
                searchQuery={searchText}
                onSearchChange={setSearchText}
                actions={
                    <div className="bg-white px-4 py-2 rounded-xl border border-monchito-purple/10 shadow-sm flex items-center gap-3">
                        <div className="bg-monchito-purple/5 p-2 rounded-lg text-monchito-purple">
                            <DollarSign className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">Total Global</p>
                            <p className="text-lg font-bold text-slate-700 leading-none">${totalCredits.toFixed(2)}</p>
                        </div>
                    </div>
                }
            />

            <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle de Créditos</span>
                    <span className="text-xs font-medium text-slate-400">
                        {filteredCredits.length} cliente{filteredCredits.length !== 1 ? 's' : ''} encontrados
                    </span>
                </div>
                <ClientCreditsTable credits={filteredCredits} />
            </div>
        </div>
    );
}
