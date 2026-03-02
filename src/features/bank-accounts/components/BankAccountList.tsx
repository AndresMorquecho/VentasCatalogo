import { useState } from "react"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import type { BankAccount } from "@/entities/bank-account/model/types"
import { BankAccountTable } from "./BankAccountTable"
import { BankAccountForm } from "./BankAccountForm"
import { Button } from "@/shared/ui/button"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Plus, AlertCircle, RotateCw, Banknote, Landmark, Wallet } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { useAuth } from "@/shared/auth"
import { useToast } from "@/shared/ui/use-toast"

export function BankAccountList() {
    const { data: accounts = [], isLoading, isError, refetch } = useBankAccountList()
    const { hasPermission } = useAuth()
    const { showToast } = useToast()
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const handleCreate = () => {
        if (!hasPermission('bank_accounts.create')) {
            showToast('No tienes permiso para crear cuentas bancarias', 'error')
            return
        }
        setSelectedAccount(null)
        setIsFormOpen(true)
    }

    const handleEdit = (account: BankAccount) => {
        if (!hasPermission('bank_accounts.edit')) {
            showToast('No tienes permiso para editar cuentas bancarias', 'error')
            return
        }
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
        <div className="space-y-4">
            <PageHeader
                title="Gestión Financiera"
                description="Monitorea tus estados de cuenta, efectivos y saldos bancarios en tiempo real."
                icon={Landmark}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white px-6 py-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-monchito-teal/30 group">
                    <div className="bg-monchito-teal/5 p-4 rounded-xl text-monchito-teal shadow-inner border border-monchito-teal/10 group-hover:bg-monchito-teal/10 transition-colors">
                        <Banknote className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Total Efectivo</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">{formatCurrency(totalCash)}</p>
                    </div>
                </div>
                <div className="bg-white px-6 py-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-monchito-purple/30 group">
                    <div className="bg-monchito-purple/5 p-4 rounded-xl text-monchito-purple shadow-inner border border-monchito-purple/10 group-hover:bg-monchito-purple/10 transition-colors">
                        <Landmark className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Total Banco</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">{formatCurrency(totalBank)}</p>
                    </div>
                </div>
                <div className="bg-white px-6 py-5 rounded-xl border border-monchito-gold/20 shadow-sm flex items-center gap-5 bg-gradient-to-br from-white to-monchito-gold/5 transition-all hover:shadow-md hover:border-monchito-gold/40 group">
                    <div className="bg-monchito-gold/10 p-4 rounded-xl text-monchito-gold shadow-inner border border-monchito-gold/20 group-hover:bg-monchito-gold/20 transition-colors">
                        <Wallet className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Total General</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">{formatCurrency(grandTotal)}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 pb-2">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1.5 rounded-full bg-monchito-purple" />
                    <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase text-[13px] tracking-widest font-monchito">Detalle de Cuentas Financieras</h2>
                </div>
                <Button
                    onClick={handleCreate}
                    className="gap-2 bg-monchito-purple hover:bg-monchito-purple-dark text-white h-10 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all shrink-0"
                >
                    <Plus className="h-4 w-4" /> Nueva Cuenta
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <BankAccountTable
                    accounts={accounts}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                />
            </div>

            <BankAccountForm
                account={selectedAccount}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />
        </div>
    )
}
