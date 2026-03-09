import { useState, useMemo, useEffect } from "react"
import { useTransactions } from "../model/hooks"
import { TransactionsTable } from "./TransactionsTable"
import { TransactionDetailsModal } from "./TransactionDetailsModal"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, Loader2, X } from "lucide-react"
import { useDebounce } from "@/shared/lib/hooks"
import { Pagination } from "@/shared/ui/pagination"
import type { FinancialRecord } from "@/entities/financial-record/model/types"

export function TransactionsPage() {
    const [page, setPage] = useState(1)
    const [limit] = useState(50)
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearch = useDebounce(searchTerm, 1000)

    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [viewTx, setViewTx] = useState<FinancialRecord | null>(null)

    // Memoize filters to prevent infinite re-render loops from TanStack Query key changes
    const filters = useMemo(() => ({
        referenceNumber: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit
    }), [debouncedSearch, startDate, endDate, page, limit]);

    // Reset page to 1 on filter changes
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, startDate, endDate]);

    const { data: response, isLoading } = useTransactions(filters)
    const transactions = response?.data || []
    const pagination = response?.pagination


    const handleClear = () => {
        setSearchTerm("")
        setStartDate("")
        setEndDate("")
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-2 px-1">
                <div className="space-y-1 sm:space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transacciones Financieras</h1>
                    <h2 className="text-base font-medium text-muted-foreground tracking-tight">Registro centralizado de depósitos, transferencias y cheques.</h2>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
                <div className="w-full md:w-64">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar Referencia</label>
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
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde</label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta</label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                {(searchTerm || startDate || endDate) && (
                    <Button variant="ghost" size="icon" onClick={handleClear} className="mb-0.5" title="Limpiar filtros">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
                </div>
            ) : (
                <>
                    <TransactionsTable transactions={transactions} onView={setViewTx} />
                    {pagination && (
                        <Pagination
                            currentPage={page}
                            totalPages={pagination.pages}
                            onPageChange={setPage}
                            totalItems={pagination.total}
                            itemsPerPage={limit}
                        />
                    )}
                </>
            )}

            <TransactionDetailsModal
                open={!!viewTx}
                onOpenChange={(v) => !v && setViewTx(null)}
                transaction={viewTx}
            />
        </div>
    )
}
