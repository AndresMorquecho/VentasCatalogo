import { useState, useMemo, useEffect } from "react"
import { useTransactions } from "../model/hooks"
import { TransactionsTable } from "./TransactionsTable"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, Loader2, RotateCcw, DollarSign, Filter, Activity, FileDown } from "lucide-react"
import { useDebounce } from "@/shared/lib/hooks"
import { Pagination } from "@/shared/ui/pagination"
import { PageHeader } from "@/shared/ui/PageHeader"
import { DateRangePicker } from "@/shared/ui/filters"
import { ClientSearchSelect } from "@/shared/ui/filters/ClientSearchSelect"
import { UserSearchSelect } from "@/shared/ui/filters/UserSearchSelect"
import type { DateRange } from "react-day-picker"
import { useBankAccounts } from "@/entities/bank-account"
import { exportTransactionsToExcel } from "@/shared/lib/exportExcel"

const ACCOUNT_TYPE_OPTIONS = [
    { value: "", label: "Todas las Cuentas" },
    { value: "CASH", label: "Caja Efectivo" },
    { value: "BANK_ACCOUNT", label: "Cuentas Bancarias" },
    { value: "WALLET", label: "Abonos con Billetera (Wallet)" },
]

export function TransactionsPage() {
    const [page, setPage] = useState(1)
    const [limit] = useState(50)
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearch = useDebounce(searchTerm, 500)

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [accountType, setAccountType] = useState("")
    const [bankAccountId, setBankAccountId] = useState("")
    const [clientId, setClientId] = useState<string | undefined>()
    const [createdBy, setCreatedBy] = useState<string | undefined>()

    const { data: bankAccountsData } = useBankAccounts()
    const bankAccounts = bankAccountsData?.data || []

    const filteredBankAccounts = useMemo(() => {
        if (!accountType) return bankAccounts
        const typeMap: Record<string, string> = { 'CASH': 'CASH', 'BANK_ACCOUNT': 'BANK', 'WALLET': 'VIRTUAL' }
        const targetType = typeMap[accountType]
        return bankAccounts.filter((acc: any) => acc.type === targetType)
    }, [accountType, bankAccounts])

    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    const filters = useMemo(() => ({
        referenceNumber: debouncedSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        accountType: accountType || undefined,
        bankAccountId: bankAccountId || undefined,
        clientId: clientId || undefined,
        createdBy: createdBy || undefined,
        page,
        limit
    }), [debouncedSearch, startDate, endDate, accountType, bankAccountId, clientId, createdBy, page, limit]);

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate, accountType, bankAccountId, clientId, createdBy]);

    useEffect(() => {
        setBankAccountId("")
    }, [accountType]);

    const { data: response, isLoading } = useTransactions(filters)
    const cards = response?.data || []
    const pagination = response?.pagination

    const handleClear = () => {
        setSearchTerm("")
        setDateRange(undefined)
        setAccountType("")
        setBankAccountId("")
        setClientId(undefined)
        setCreatedBy(undefined)
    }

    const handleExport = () => {
        if (!cards || cards.length === 0) return;
        exportTransactionsToExcel(cards, `Transacciones_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    return (
        <div className="min-h-screen bg-[#fcfaff]">
            <div className="px-4 lg:px-12 pt-12 space-y-12">
                <PageHeader
                    title="Control de Movimientos"
                    description="Trazabilidad total de fondos, arqueo de caja y auditoría transaccional."
                    icon={DollarSign}
                    actions={
                        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <Button 
                                variant="outline" 
                                onClick={handleExport} 
                                disabled={!response?.data || response.data.length === 0}
                                className="h-10 px-2 sm:px-4 gap-1.5 sm:gap-2 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all duration-300 w-full sm:w-auto"
                            >
                                <FileDown className="h-4 w-4" />
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Excel</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={handleClear} 
                                className="h-10 px-2 sm:px-4 gap-1.5 sm:gap-2 rounded-xl border-slate-200 text-slate-500 hover:text-monchito-purple transition-all duration-300 w-full sm:w-auto"
                            >
                                <RotateCcw className="h-4 w-4" />
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none">Reiniciar</span>
                            </Button>
                        </div>
                    }
                />

                {/* Glassmorphic Filter Panel */}
                <div className="relative z-[20] bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-slate-100 shadow-[0_15px_50px_rgba(0,0,0,0.03)] focus-within:shadow-[0_20px_60px_rgba(0,0,0,0.05)] transition-all duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                <Search className="h-3 w-3" /> Buscar Comprobante
                             </label>
                             <div className="relative">
                                <Input
                                    placeholder="N° de referencia o recibo..."
                                    className="h-11 bg-white border-slate-200 rounded-xl px-4 font-bold text-slate-700 shadow-sm transition-all focus:ring-monchito-purple/20 focus:border-monchito-purple"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                <Filter className="h-3 w-3" /> Tipo de Cuenta
                             </label>
                             <select
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value)}
                                className="w-full h-11 bg-white border-slate-200 rounded-xl px-4 font-bold text-slate-700 shadow-sm transition-all focus:ring-monchito-purple/20 focus:border-monchito-purple outline-none appearance-none cursor-pointer"
                            >
                                {ACCOUNT_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                <Activity className="h-3 w-3" /> Depósito / Caja
                             </label>
                             <select
                                value={bankAccountId}
                                onChange={(e) => setBankAccountId(e.target.value)}
                                className="w-full h-11 bg-white border-slate-200 rounded-xl px-4 font-bold text-slate-700 shadow-sm transition-all focus:ring-monchito-purple/20 focus:border-monchito-purple outline-none appearance-none cursor-pointer"
                            >
                                <option value="">Todas las cuentas</option>
                                {filteredBankAccounts.map((acc: any) => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Periodo</label>
                             <DateRangePicker value={dateRange} onChange={setDateRange} label="" />
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Filtrar por Empresaria</label>
                             <ClientSearchSelect value={clientId} onChange={setClientId} label="" />
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Usuario del Sistema</label>
                             <UserSearchSelect value={createdBy} onChange={setCreatedBy} label="" />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="space-y-6 pb-12">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-monchito-purple" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Libro Diario Transaccional</h2>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                             Resultados: {pagination?.totalCards || 0}
                        </div>
                     </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-32 gap-4 text-slate-400">
                                <Loader2 className="animate-spin h-10 w-10 text-monchito-purple" />
                                <span className="font-black text-xs uppercase tracking-widest">Sincronizando movimientos...</span>
                            </div>
                        ) : (
                            <>
                                <TransactionsTable cards={cards} isLoading={false} />
                                {pagination && pagination.pages > 1 && (
                                    <div className="p-6 border-t border-slate-50 bg-slate-50/10">
                                        <Pagination
                                            currentPage={page}
                                            totalPages={pagination.pages}
                                            onPageChange={setPage}
                                            totalItems={pagination.totalCards}
                                            itemsPerPage={limit}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

