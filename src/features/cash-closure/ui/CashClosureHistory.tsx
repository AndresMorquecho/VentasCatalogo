import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import type { CashClosure } from "@/entities/cash-closure/model/types"

interface CashClosureHistoryProps {
    closures: CashClosure[]
}

export function CashClosureHistory({ closures }: CashClosureHistoryProps) {
    if (!closures || closures.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No hay cierres registrados.</div>
    }

    return (
        <div className="rounded-md border mt-8">
            <h3 className="text-lg font-semibold tracking-tight p-4">Historial de Cierres</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha Cierre</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead className="text-right text-green-600">Total Ingresos</TableHead>
                        <TableHead className="text-right text-red-600">Total Egresos</TableHead>
                        <TableHead className="text-right">Neto</TableHead>
                        <TableHead className="text-right text-muted-foreground">Movimientos</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {closures.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell className="font-medium">
                                {new Date(c.closedAt).toLocaleDateString()}
                                <div className="text-xs text-muted-foreground">
                                    {new Date(c.closedAt).toLocaleTimeString()}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">
                                    {new Date(c.fromDate).toLocaleDateString()} - {new Date(c.toDate).toLocaleDateString()}
                                </span>
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-mono">
                                ${c.totalIncome.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-mono">
                                ${c.totalExpense.toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${c.netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                ${c.netTotal.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                {c.movementCount}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
