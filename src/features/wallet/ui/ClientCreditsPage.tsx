import { useState, useEffect } from "react";
import { useClientCredits } from "../model/hooks";
import { ClientCreditsTable } from "./ClientCreditsTable";
import { Input } from "@/shared/ui/input";
import { Search, Wallet, DollarSign, Plus, History, List } from "lucide-react";
import { useDebounce } from "@/shared/lib/hooks";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/button";
import { RechargeWalletModal } from "./RechargeWalletModal";
import { Pagination } from "@/shared/ui/pagination";
import { MonchitoTabs } from "@/shared/ui/MonchitoTabs";
import { WalletHistory } from "./WalletHistory";

export function ClientCreditsPage() {
    const [activeTab, setActiveTab] = useState("saldos");
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebounce(searchText, 1000);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [rechargeModalOpen, setRechargeModalOpen] = useState(false);

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

    const tabs = [
        { id: "saldos", label: "Saldos Actuales", icon: List },
        { id: "historial", label: "Historial de Recargas", icon: History }
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Billetera Virtual" 
                description="Gestión de saldos a favor y solicitudes de recarga"
                icon={Wallet}
                actions={
                    <Button 
                        className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 shadow-lg shadow-primary/20"
                        onClick={() => setRechargeModalOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Recargar Billetera
                    </Button>
                }
            />

            <MonchitoTabs 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
            />

            {activeTab === "saldos" ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white px-6 py-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
                            <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Total en Billeteras</p>
                                <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">${totalCredits.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        
                        <div className="md:col-span-2 bg-white p-5 rounded-2xl border shadow-sm flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[240px]">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Buscar Cliente</label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Nombre, apellido o identificación..."
                                        className="pl-11 h-11 border-slate-200 bg-slate-50/50 font-medium"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="h-11 flex items-center px-4 bg-slate-50 rounded-xl border border-dotted border-slate-200 mb-0.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    {filteredCredits.length} cliente{filteredCredits.length !== 1 ? 's' : ''} con saldo
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        {isLoading ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando saldos...</div>
                        ) : (
                            <ClientCreditsTable credits={filteredCredits} />
                        )}
                    </div>

                    {pagination && !isLoading && (
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
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <WalletHistory />
                </div>
            )}

            <RechargeWalletModal 
                open={rechargeModalOpen}
                onOpenChange={setRechargeModalOpen}
            />
        </div>
    );
}
