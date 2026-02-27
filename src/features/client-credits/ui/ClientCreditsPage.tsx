import { useState } from "react";
import { useClientCredits } from "../model/hooks";
import { ClientCreditsTable } from "./ClientCreditsTable";
import { Input } from "@/shared/ui/input";
import { Search, Gift, DollarSign } from "lucide-react";

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

    // Calculate total credits
    const totalCredits = filteredCredits.reduce((sum, c) => sum + Number(c.totalCredit), 0);

    if (isLoading) return <div className="p-8">Cargando saldos a favor...</div>;
    if (isError) return <div className="p-8 text-red-500">Error al cargar saldos a favor.</div>;

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b pb-4 border-emerald-200">
                <div>
                    <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-2">
                        <Gift className="h-8 w-8" />
                        Saldos a Favor
                    </h1>
                    <p className="text-emerald-700 text-sm mt-1">
                        Créditos disponibles de clientes para futuros pedidos
                    </p>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl border border-emerald-100 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.3)] flex items-center gap-3 min-w-[220px]">
                    <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[11px] font-semibold mb-0.5">Total Saldos a Favor</p>
                        <p className="text-xl font-bold text-slate-800 tracking-tight leading-none">${totalCredits.toFixed(2)}</p>
                    </div>
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
        </div>
    );
}
