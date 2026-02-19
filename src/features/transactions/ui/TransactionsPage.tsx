import { useState } from "react"
import { useTransactions } from "../model/hooks"
import { TransactionsTable } from "./TransactionsTable"
import { TransactionDetailsModal } from "./TransactionDetailsModal"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Search, Loader2, X } from "lucide-react"
import type { FinancialTransaction } from "@/entities/financial-transaction/model/types"

export function TransactionsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [viewTx, setViewTx] = useState<FinancialTransaction | null>(null)

    // Debounce search or just pass
    const { data: transactions = [], isLoading } = useTransactions({
        referenceNumber: searchTerm,
        startDate: startDate || undefined,
        endDate: endDate || undefined
    })

    const handleClear = () => {
        setSearchTerm("")
        setStartDate("")
        setEndDate("")
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transacciones Financieras</h1>
                    <p className="text-slate-500 text-sm">Registro centralizado de depósitos, transferencias y cheques.</p>
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
                <TransactionsTable transactions={transactions} onView={setViewTx} />
            )}

            <TransactionDetailsModal
                open={!!viewTx}
                onOpenChange={(v) => !v && setViewTx(null)}
                transaction={viewTx}
            />
        </div>
    )
}
