import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Eye } from "lucide-react"
import type { FinancialTransaction } from "@/entities/financial-transaction/model/types"

interface Props {
    transactions: FinancialTransaction[]
    onView: (t: FinancialTransaction) => void
}

export function TransactionsTable({ transactions, onView }: Props) {
    return (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Comprobante</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Operador</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No hay transacciones registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map(t => (
                            <TableRow key={t.id} className="hover:bg-slate-50">
                                <TableCell>
                                    {new Date(t.date).toLocaleDateString('es-EC')}
                                </TableCell>
                                <TableCell className="font-medium text-slate-800">
                                    {t.clientId} {/* In real app, resolved name */}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        t.type === 'DEPOSITO' ? 'default' :
                                            t.type === 'TRANSFERENCIA' ? 'outline' : 'secondary'
                                    }>
                                        {t.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{t.referenceNumber}</TableCell>
                                <TableCell className="text-right font-bold text-slate-700">
                                    ${t.amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">
                                    {t.createdBy}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => onView(t)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
