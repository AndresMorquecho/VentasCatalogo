import { useState } from "react";
import { useClientCredits } from "../model/hooks";
import { ClientCreditsTable } from "./ClientCreditsTable";
import { Input } from "@/shared/ui/input";
import { Search, Gift } from "lucide-react";

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
    const totalCredits = filteredCredits.reduce((sum, c) => sum + c.totalCredit, 0);

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
                <div className="bg-emerald-50 px-6 py-3 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium">Total Saldos a Favor</p>
                    <p className="text-2xl font-bold text-emerald-700">${totalCredits.toFixed(2)}</p>
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
