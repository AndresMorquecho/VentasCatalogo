import { useState } from "react"
import { useBankAccountList } from "@/entities/bank-account/model/hooks"
import type { BankAccount } from "@/entities/bank-account/model/types"
import { BankAccountTable } from "./BankAccountTable"
import { BankAccountForm } from "./BankAccountForm"
import { Button } from "@/shared/ui/button"
import { Plus, AlertCircle, RotateCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"

export function BankAccountList() {
    const { data: accounts = [], isLoading, isError, refetch } = useBankAccountList()
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const handleCreate = () => {
        setSelectedAccount(null)
        setIsFormOpen(true)
    }

    const handleEdit = (account: BankAccount) => {
        setSelectedAccount(account)
        setIsFormOpen(true)
    }

    if (isError) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold tracking-tight">Cuentas Financieras</h2>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error de Carga</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>No se pudieron cargar las cuentas bancarias.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="bg-background text-foreground hover:bg-accent border-destructive/50"
                        >
                            <RotateCw className="mr-2 h-3 w-3" />
                            Reintentar
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const totalCash = accounts
        .filter(a => a.type === 'CASH')
        .reduce((sum, a) => sum + a.currentBalance, 0);

    const totalBank = accounts
        .filter(a => a.type === 'BANK')
        .reduce((sum, a) => sum + a.currentBalance, 0);

    const grandTotal = totalCash + totalBank;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-emerald-800 uppercase tracking-wider">Total Efectivo</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalCash)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-800 uppercase tracking-wider">Total Banco</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(totalBank)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-800 uppercase tracking-wider">Total General</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(grandTotal)}</p>
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <h2 className="text-xl font-semibold tracking-tight">Detalle de Cuentas</h2>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta
                </Button>
            </div>

            <BankAccountTable
                accounts={accounts}
                isLoading={isLoading}
                onEdit={handleEdit}
            />

            <BankAccountForm
                account={selectedAccount}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />
        </div>
    )
}
