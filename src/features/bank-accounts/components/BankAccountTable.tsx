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
import { Pencil } from "lucide-react"
import { Switch } from "@/shared/ui/switch"
import type { BankAccount } from "@/entities/bank-account/model/types"
import { useToggleBankAccountStatus } from "@/features/bank-accounts/api/hooks"
import { useAuth } from "@/shared/auth"
import { useToast } from "@/shared/ui/use-toast"

interface BankAccountTableProps {
    accounts: BankAccount[]
    isLoading: boolean
    onEdit: (account: BankAccount) => void
}

export function BankAccountTable({ accounts, isLoading, onEdit }: BankAccountTableProps) {
    const toggleStatus = useToggleBankAccountStatus()
    const { hasPermission } = useAuth()
    const { showToast } = useToast()

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

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Saldo Actual</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.map((acc) => (
                        <TableRow key={acc.id}>
                            <TableCell className="font-medium">
                                {acc.name}
                                {acc.description && acc.description !== acc.name && (
                                    <span className="block text-xs text-muted-foreground font-normal">{acc.description}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {acc.type === 'CASH' ? 'Efectivo' : 'Banco'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className={(Number(acc.currentBalance) || 0) < 0 ? "text-red-500 font-bold" : "font-medium"}>
                                    ${(Number(acc.currentBalance) || 0).toFixed(2)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={acc.isActive}
                                        onCheckedChange={() => {
                                            if (!hasPermission('bank_accounts.edit')) {
                                                showToast('No tienes permiso para cambiar el estado de cuentas', 'error')
                                                return
                                            }
                                            toggleStatus.mutate(acc.id)
                                        }}
                                    />
                                    <span className={`text-xs ${acc.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                                        {acc.isActive ? "Activa" : "Inactiva"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(acc)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
