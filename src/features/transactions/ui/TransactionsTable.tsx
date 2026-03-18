import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Eye, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import type { FinancialRecord } from "@/entities/financial-record/model/types"

interface Props {
    transactions: FinancialRecord[]
    onView: (t: FinancialRecord) => void
}

const TYPE_LABELS: Record<string, string> = {
    PAYMENT: 'Abono',
    CREDIT_GENERATION: 'Saldo generado',
    CREDIT_APPLICATION: 'Saldo aplicado',
    ADJUSTMENT: 'Ajuste',
    EXPENSE: 'Gasto',
}

const METHOD_LABELS: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TRANSFERENCIA: 'Transferencia',
    DEPOSITO: 'Depósito',
    CHEQUE: 'Cheque',
    CREDITO_CLIENTE: 'Billetera virtual',
    BILLETERA_VIRTUAL: 'Billetera virtual',
    SALDO_A_FAVOR: 'Saldo a favor',
}

function getTypeBadge(t: FinancialRecord) {
    if (t.type === 'CREDIT_GENERATION') {
        return <Badge className="bg-emerald-100 text-emerald-700 border-none">Saldo generado</Badge>
    }
    if (t.type === 'CREDIT_APPLICATION') {
        const label = t.paymentMethod === 'CREDITO_CLIENTE' || t.paymentMethod === 'BILLETERA_VIRTUAL'
            ? 'Uso billetera'
            : 'Saldo aplicado'
        return <Badge className="bg-amber-100 text-amber-700 border-none">{label}</Badge>
    }
    if (t.paymentMethod === 'CREDITO_CLIENTE' || t.paymentMethod === 'BILLETERA_VIRTUAL') {
        return <Badge className="bg-purple-100 text-purple-700 border-none">Billetera virtual</Badge>
    }
    if (t.paymentMethod === 'DEPOSITO') return <Badge variant="default">{METHOD_LABELS[t.paymentMethod]}</Badge>
    if (t.paymentMethod === 'TRANSFERENCIA') return <Badge variant="outline">{METHOD_LABELS[t.paymentMethod]}</Badge>
    return <Badge variant="secondary">{METHOD_LABELS[t.paymentMethod || ''] || TYPE_LABELS[t.type] || t.type}</Badge>
}

export function TransactionsTable({ transactions, onView }: Props) {
    return (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
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
                            <TableCell colSpan={8} className="h-24 text-center">
                                No hay transacciones registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map(t => {
                            const isIncome = t.movementType === 'INCOME'
                            return (
                                <TableRow key={t.id} className="hover:bg-slate-50">
                                    <TableCell>
                                        {isIncome
                                            ? <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                                            : <ArrowUpCircle className="h-4 w-4 text-amber-600" />
                                        }
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(t.date).toLocaleDateString('es-EC')}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-800">
                                        {t.clientName || t.clientId}
                                    </TableCell>
                                    <TableCell>
                                        {getTypeBadge(t)}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{t.referenceNumber}</TableCell>
                                    <TableCell className={`text-right font-bold ${isIncome ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {isIncome ? '+' : '-'}${t.amount.toFixed(2)}
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
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
