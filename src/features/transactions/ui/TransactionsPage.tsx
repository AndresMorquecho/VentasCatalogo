import { useState, useMemo, useEffect } from "react"
import { useTransactionCards } from "@/entities/financial-record/model/queries"
import { TransactionsTable } from "./TransactionsTable"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, Loader2, X, DollarSign } from "lucide-react"
import { useDebounce } from "@/shared/lib/hooks"
import { PageHeader } from "@/shared/ui/PageHeader"
import { DateRangePicker } from "@/shared/ui/filters"
import { ClientSearchSelect } from "@/shared/ui/filters/ClientSearchSelect"
import { UserSearchSelect } from "@/shared/ui/filters/UserSearchSelect"
import type { DateRange } from "react-day-picker"
import { useBankAccounts } from "@/entities/bank-account"
const ACCOUNT_TYPE_OPTIONS = [
    { value: "", label: "Todas las cuentas" },
    { value: "CASH", label: "Efectivo" },
    { value: "BANK_ACCOUNT", label: "Banco" },
    { value: "WALLET", label: "Billetera Virtual" },
]

export function TransactionsPage() {
    const [page, setPage] = useState(1)
    const [limit] = useState(12)
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearch = useDebounce(searchTerm, 1000)

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [accountType, setAccountType] = useState("")
    const [bankAccountId, setBankAccountId] = useState("")
    const [clientId, setClientId] = useState<string | undefined>()
    const [createdBy, setCreatedBy] = useState<string | undefined>()

    const { data: bankAccountsData } = useBankAccounts()
    const bankAccounts = bankAccountsData?.data || []

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    const filters = useMemo(() => ({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        clientId: clientId || undefined,
        createdBy: createdBy || undefined,
        page,
        limit
    }), [startDate, endDate, clientId, createdBy, page, limit]);

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate, accountType, bankAccountId, clientId, createdBy]);

    const filteredBankAccounts = useMemo(() => {
        if (!accountType) return bankAccounts;
        if (accountType === 'BANK_ACCOUNT') {
            return bankAccounts.filter((acc: any) => acc.type === 'BANK');
        }
        if (accountType === 'CASH') {
            return bankAccounts.filter((acc: any) => acc.type === 'CASH');
        }
        return bankAccounts;
    }, [bankAccounts, accountType]);

    // Reset sub-filters when account type changes
    useEffect(() => {
        setBankAccountId("")
        setClientId(undefined)
        setCreatedBy(undefined)
    }, [accountType]);

    const { data: response, isLoading } = useTransactionCards(filters)
    const cardList = response?.data ?? []
    const pagination = response?.pagination;

    const hasFilters = !!(searchTerm || dateRange?.from || accountType || bankAccountId || clientId || createdBy)

    const handleClear = () => {
        setSearchTerm("")
        setDateRange(undefined)
        setAccountType("")
        setBankAccountId("")
        setClientId(undefined)
        setCreatedBy("")
    }

    // Show bank account filter only when BANK_ACCOUNT or CASH is selected
    const showBankAccountFilter = accountType === "BANK_ACCOUNT" || accountType === "CASH"
    // Show client filter only when WALLET is selected
    const showClientFilter = accountType === "WALLET"

    return (
        <div className="space-y-6">
            <PageHeader
                title="Transacciones Financieras"
                description="Registro centralizado de depósitos, transferencias y cheques"
                icon={DollarSign}
            />

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
                {/* First row: Search, Date Range, and User */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-full md:w-64">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar Comprobante</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="N° Comprobante..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-auto min-w-[280px]">
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            label="Rango de Fechas"
                            placeholder="Seleccionar periodo"
                        />
                    </div>

                    <div className="w-full md:w-48">
                        <UserSearchSelect
                            value={createdBy}
                            onChange={setCreatedBy}
                            label="Usuario"
                            placeholder="Buscar usuario..."
                        />
                    </div>

                    {hasFilters && (
                        <Button variant="ghost" size="icon" onClick={handleClear} className="mb-0.5" title="Limpiar filtros">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Second row: Account Type and conditional filters */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-full md:w-48">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Cuenta</label>
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            {ACCOUNT_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {showBankAccountFilter && (
                        <div className="w-full md:w-64">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                {accountType === 'CASH' ? 'Caja' : 'Cuenta Bancaria'}
                            </label>
                            <select
                                value={bankAccountId}
                                onChange={(e) => setBankAccountId(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Todas las cuentas</option>
                                {filteredBankAccounts.map((acc: any) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {showClientFilter && (
                        <div className="w-full md:w-64">
                            <ClientSearchSelect
                                value={clientId}
                                onChange={setClientId}
                                label="Cliente"
                                placeholder="Buscar cliente..."
                            />
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
                </div>
            ) : (
                <div className="space-y-6">
                    <TransactionsTable cards={cardList} isLoading={isLoading} />
                    
                    {/* Pagination Controls */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={page === pagination.pages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-700 font-medium">
                                        Mostrando <span className="font-bold">{(page - 1) * limit + 1}</span> a <span className="font-bold">{Math.min(page * limit, pagination.totalRecords)}</span> de{' '}
                                        <span className="font-bold">{pagination.totalRecords}</span> resultados
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        «
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="text-xs font-semibold"
                                    >
                                        Anterior
                                    </Button>
                                    
                                    <div className="flex items-center gap-1 mx-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Página</span>
                                        <Input 
                                            type="number"
                                            value={page}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val >= 1 && val <= pagination.pages) {
                                                    setPage(val);
                                                }
                                            }}
                                            className="w-12 h-8 text-center p-0 font-bold"
                                        />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">de {pagination.pages}</span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                        disabled={page === pagination.pages}
                                        className="text-xs font-semibold"
                                    >
                                        Siguiente
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(pagination.pages)}
                                        disabled={page === pagination.pages}
                                        className="h-8 w-8 p-0"
                                    >
                                        »
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}


        </div>
    )
}
