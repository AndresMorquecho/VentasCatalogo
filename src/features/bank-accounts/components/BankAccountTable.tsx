import { Skeleton } from "@/shared/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { Switch } from "@/shared/ui/switch"
import type { BankAccount } from "@/entities/bank-account/model/types"
import { useToggleBankAccountStatus } from "@/features/bank-accounts/api/hooks"
import { useAuth } from "@/shared/auth"
import { useNotifications } from "@/shared/lib/notifications"
import { logAction } from "@/shared/lib/auditService"

interface BankAccountTableProps {
    accounts: BankAccount[]
    isLoading: boolean
    onEdit: (account: BankAccount) => void
    onDelete: (account: BankAccount) => void
}

export function BankAccountTable({ accounts, isLoading, onEdit, onDelete }: BankAccountTableProps) {
    const toggleStatus = useToggleBankAccountStatus()
    const { hasPermission, user } = useAuth()
    const { notifySuccess, notifyError } = useNotifications()

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (accounts.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No hay cuentas registradas.</div>
    }

    const showPeriodData = accounts.some(a => a.periodIncome !== undefined);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50">
                        <TableHead className="whitespace-nowrap text-xs">Nombre</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Tipo</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Saldo Actual</TableHead>
                        {showPeriodData && (
                            <>
                                <TableHead className="whitespace-nowrap text-xs text-center text-emerald-600 bg-emerald-50/30">Ingresos (P)</TableHead>
                                <TableHead className="whitespace-nowrap text-xs text-center text-red-600 bg-red-50/30">Egresos (P)</TableHead>
                                <TableHead className="whitespace-nowrap text-xs text-center font-bold bg-slate-100/50">Neto (P)</TableHead>
                            </>
                        )}
                        <TableHead className="whitespace-nowrap text-xs">Estado</TableHead>
                        <TableHead className="text-right whitespace-nowrap text-xs">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.map((acc) => (
                        <TableRow key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-medium text-xs sm:text-sm">
                                {acc.name}
                                {acc.description && acc.description !== acc.name && (
                                    <span className="block text-[10px] sm:text-xs text-muted-foreground font-normal">{acc.description}</span>
                                )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                                    {acc.type === 'CASH' ? 'Efectivo' : 'Banco'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                                <span className={(Number(acc.currentBalance) || 0) < 0 ? "text-red-500 font-bold" : "font-medium"}>
                                    {formatCurrency(Number(acc.currentBalance) || 0)}
                                </span>
                            </TableCell>
                            
                            {showPeriodData && (
                                <>
                                    <TableCell className="text-center text-xs text-emerald-600 font-bold bg-emerald-50/5 cursor-default">
                                        {acc.periodIncome ? `+${formatCurrency(acc.periodIncome)}` : '—'}
                                    </TableCell>
                                    <TableCell className="text-center text-xs text-red-500 font-bold bg-red-50/5 cursor-default">
                                        {acc.periodExpense ? `-${formatCurrency(acc.periodExpense)}` : '—'}
                                    </TableCell>
                                    <TableCell className={`text-center text-xs font-black bg-slate-50/30 cursor-default ${Number(acc.periodNet) < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                        {acc.periodNet ? formatCurrency(acc.periodNet) : '$0.00'}
                                    </TableCell>
                                </>
                            )}

                            <TableCell className="text-xs sm:text-sm">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={acc.isActive}
                                        disabled={acc.type === 'VIRTUAL'}
                                        onCheckedChange={async () => {
                                            if (!hasPermission('bank_accounts.edit')) {
                                                notifyError({ message: 'No tienes permiso para cambiar el estado de cuentas' })
                                                return
                                            }
                                            try {
                                                await toggleStatus.mutateAsync(acc.id)
                                                notifySuccess(`Cuenta "${acc.name}" ${!acc.isActive ? 'activada' : 'desactivada'} correctamente`)
                                                if (user) {
                                                    logAction({
                                                        userId: user.id,
                                                        userName: user.username,
                                                        action: 'UPDATE_USER',
                                                        module: 'bank_accounts' as any,
                                                        detail: `${!acc.isActive ? 'Activó' : 'Desactivó'} cuenta bancaria: ${acc.name}`
                                                    });
                                                }
                                            } catch (error) {
                                                notifyError(error, "Error al cambiar estado")
                                            }
                                        }}
                                    />
                                    <span className={`text-[10px] font-bold uppercase ${acc.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                                        {acc.isActive ? "Activa" : "Inactiva"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-0.5 sm:gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(acc)}
                                        disabled={showPeriodData}
                                        title={showPeriodData ? "No se puede editar mientras haya un filtro de fecha activo" : "Editar cuenta"}
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                    >
                                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => onDelete(acc)}
                                        disabled={showPeriodData || acc.type === 'VIRTUAL'}
                                        title={acc.type === 'VIRTUAL' ? "La cuenta virtual no se puede eliminar" : showPeriodData ? "No se puede eliminar mientras haya un filtro de fecha activo" : "Eliminar cuenta"}
                                    >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        </div>
    )
}
