import { useState } from "react"
import { useBankAccountList, useDeleteBankAccount } from "@/features/bank-accounts/api/hooks"
import type { BankAccount } from "@/entities/bank-account/model/types"
import { BankAccountTable } from "./BankAccountTable"
import { BankAccountForm } from "./BankAccountForm"
import { Button } from "@/shared/ui/button"
import { Plus, AlertCircle, RotateCw, Banknote, Landmark, Wallet } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { useAuth } from "@/shared/auth"
import { useNotifications } from "@/shared/lib/notifications"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { logAction } from "@/shared/lib/auditService"
import { Pagination } from "@/shared/ui/pagination"

export function BankAccountList() {
    const [page, setPage] = useState(1)
    const [limit] = useState(25)
    const { data: response, isLoading, isError, refetch } = useBankAccountList({ page, limit })

    const accounts = response?.data || []
    const pagination = response?.pagination

    const deleteAccount = useDeleteBankAccount()
    const { hasPermission, user } = useAuth()
    const { notifySuccess, notifyError } = useNotifications()
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const handleCreate = () => {
        if (!hasPermission('bank_accounts.view')) { // Standard view check
            notifyError({ message: 'No tienes permiso para ver cuentas bancarias' })
            return
        }
        if (!hasPermission('bank_accounts.create')) {
            notifyError({ message: 'No tienes permiso para crear cuentas bancarias' })
            return
        }
        setSelectedAccount(null)
        setIsFormOpen(true)
    }

    const handleEdit = (account: BankAccount) => {
        if (!hasPermission('bank_accounts.edit')) {
            notifyError({ message: 'No tienes permiso para editar cuentas bancarias' })
            return
        }
        setSelectedAccount(account)
        setIsFormOpen(true)
    }

    const handleDeleteClick = (account: BankAccount) => {
        if (!hasPermission('bank_accounts.delete')) {
            notifyError({ message: 'No tienes permiso para eliminar cuentas bancarias' })
            return
        }
        setAccountToDelete(account)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!accountToDelete) return
        try {
            await deleteAccount.mutateAsync(accountToDelete.id)
            notifySuccess(`Cuenta "${accountToDelete.name}" eliminada correctamente`)
            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'DELETE_ROLE', // Using a high level delete action
                    module: 'bank_accounts' as any,
                    detail: `Eliminó cuenta bancaria: ${accountToDelete.name}`,
                    severity: 'CRITICAL'
                });
            }
            setIsDeleteDialogOpen(false)
        } catch (error) {
            notifyError(error, "Error al eliminar la cuenta")
        }
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white px-5 py-4 rounded-xl border border-emerald-100 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)] flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                        <Banknote className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-semibold mb-1">Total Efectivo</p>
                        <p className="text-2xl font-bold text-slate-800 tracking-tight leading-none">{formatCurrency(totalCash)}</p>
                    </div>
                </div>
                <div className="bg-white px-5 py-4 rounded-xl border border-blue-100 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.2)] flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                        <Landmark className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-semibold mb-1">Total Banco</p>
                        <p className="text-2xl font-bold text-slate-800 tracking-tight leading-none">{formatCurrency(totalBank)}</p>
                    </div>
                </div>
                <div className="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(148,163,184,0.2)] flex items-center gap-4 bg-gradient-to-br from-white to-slate-50">
                    <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-semibold mb-1">Total General</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{formatCurrency(grandTotal)}</p>
                    </div>
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
                onDelete={handleDeleteClick}
            />

            <BankAccountForm
                account={selectedAccount}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />

            {pagination && (
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            )}

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title="Eliminar Cuenta"
                description={`¿Estás seguro de que deseas eliminar la cuenta "${accountToDelete?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="destructive"
            />
        </div>
    )
}

