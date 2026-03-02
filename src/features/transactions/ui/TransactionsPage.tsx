import { useState, useMemo } from "react"
import { useTransactions } from "../model/hooks"
import { TransactionsTable } from "./TransactionsTable"
import { TransactionDetailsModal } from "./TransactionDetailsModal"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Loader2, X, Landmark } from "lucide-react"
import type { FinancialRecord } from "@/entities/financial-record/model/types"
import { PageHeader } from "@/shared/ui/PageHeader"

export function TransactionsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [viewTx, setViewTx] = useState<FinancialRecord | null>(null)

    const filters = useMemo(() => ({
        referenceNumber: searchTerm,
        startDate: startDate || undefined,
        endDate: endDate || undefined
    }), [searchTerm, startDate, endDate]);

    const { data: transactions = [], isLoading } = useTransactions(filters)

    const handleClear = () => {
        setSearchTerm("")
        setStartDate("")
        setEndDate("")
    }

    return (
        <div className="space-y-4">
            <PageHeader
                title="Transacciones Financieras"
                description="Registro centralizado de depósitos, transferencias y cheques."
                icon={Landmark}
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                actions={
                    (searchTerm || startDate || endDate) && (
                        <Button variant="outline" onClick={handleClear} className="gap-2">
                            <X className="h-4 w-4" />
                            Limpiar Filtros
                        </Button>
                    )
                }
            />

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="w-full md:w-40">
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Desde</label>
                    <Input
                        type="date"
                        className="bg-slate-50 border-slate-200"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Hasta</label>
                    <Input
                        type="date"
                        className="bg-slate-50 border-slate-200"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-monchito-purple" />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <TransactionsTable transactions={transactions} onView={setViewTx} />
                </div>
            )}

            <TransactionDetailsModal
                open={!!viewTx}
                onOpenChange={(v) => !v && setViewTx(null)}
                transaction={viewTx}
            />
        </div>
    )
}
