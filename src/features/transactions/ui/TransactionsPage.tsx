import { useState, useMemo, useEffect } from "react"
import { useTransactions } from "../model/hooks"
import { TransactionsTable } from "./TransactionsTable"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, Loader2, X, DollarSign } from "lucide-react"
import { useDebounce } from "@/shared/lib/hooks"
import { Pagination } from "@/shared/ui/pagination"
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
    const [limit] = useState(50)
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearch = useDebounce(searchTerm, 1000)

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [accountType, setAccountType] = useState("")
    const [bankAccountId, setBankAccountId] = useState("")
    const [clientId, setClientId] = useState<string | undefined>()
    const [createdBy, setCreatedBy] = useState<string | undefined>()

    const { data: bankAccountsData } = useBankAccounts()
    const bankAccounts = bankAccountsData?.data || []

    // Filter bank accounts based on selected account type
    const filteredBankAccounts = useMemo(() => {
        if (!accountType) return bankAccounts
        
        const typeMap: Record<string, string> = {
            'CASH': 'CASH',
            'BANK_ACCOUNT': 'BANK',
            'WALLET': 'VIRTUAL'
        }
        
        const targetType = typeMap[accountType]
        console.log('[TransactionsPage] Filtering accounts:', { accountType, targetType, totalAccounts: bankAccounts.length })
        const filtered = bankAccounts.filter((acc: any) => {
            console.log('[TransactionsPage] Account:', { name: acc.name, type: acc.type, matches: acc.type === targetType })
            return acc.type === targetType
        })
        console.log('[TransactionsPage] Filtered accounts:', filtered.length)
        return filtered
    }, [accountType, bankAccounts])

    // Convert DateRange to strings for API
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ""
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ""

    const filters = useMemo(() => ({
        referenceNumber: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
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

    // Reset sub-filters when account type changes
    useEffect(() => {
        setBankAccountId("")
        setClientId(undefined)
    }, [accountType]);

    const { data: response, isLoading } = useTransactions(filters)
    const cards = response?.data || []
    const pagination = response?.pagination

    const hasFilters = !!(searchTerm || dateRange?.from || accountType || bankAccountId || clientId || createdBy)

    const handleClear = () => {
        setSearchTerm("")
        setDateRange(undefined)
        setAccountType("")
        setBankAccountId("")
        setClientId(undefined)
        setCreatedBy(undefined)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Transacciones Financieras"
                description="Registro centralizado de depósitos, transferencias y cheques"
                icon={DollarSign}
            />

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 space-y-4">
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

                {/* Second row: Account Type, Bank Account, and Client */}
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

                    <div className="w-full md:w-64">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Cuenta</label>
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

                    <div className="w-full md:w-64">
                        <ClientSearchSelect
                            value={clientId}
                            onChange={setClientId}
                            label="Cliente"
                            placeholder="Buscar cliente..."
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
                </div>
            ) : (
                <>
                    <TransactionsTable cards={cards} isLoading={false} />
                    {pagination && (
                        <Pagination
                            currentPage={page}
                            totalPages={pagination.pages}
                            onPageChange={setPage}
                            totalItems={pagination.totalCards}
                            itemsPerPage={limit}
                        />
                    )}
                </>
            )}
        </div>
    )
}
