import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Eye, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { format } from "date-fns"
import type { FinancialRecord } from "@/entities/financial-record/model/types"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"

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
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border">Saldo generado</Badge>
    }
    if (t.type === 'CREDIT_APPLICATION') {
        const label = t.paymentMethod === 'CREDITO_CLIENTE' || t.paymentMethod === 'BILLETERA_VIRTUAL'
            ? 'Uso billetera'
            : 'Saldo aplicado'
        return <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border">{label}</Badge>
    }
    if (t.paymentMethod === 'CREDITO_CLIENTE' || t.paymentMethod === 'BILLETERA_VIRTUAL') {
        return <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border">Billetera virtual</Badge>
    }
    if (t.paymentMethod === 'DEPOSITO') {
        return <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border">{METHOD_LABELS[t.paymentMethod]}</Badge>
    }
    if (t.paymentMethod === 'TRANSFERENCIA') {
        return <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border">{METHOD_LABELS[t.paymentMethod]}</Badge>
    }
    return <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border">{METHOD_LABELS[t.paymentMethod || ''] || TYPE_LABELS[t.type] || t.type}</Badge>
}

export function TransactionsTable({ transactions, onView }: Props) {
    if (transactions.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <p className="text-sm font-medium text-slate-400">No hay transacciones registradas.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-white">
                        <TableRow className="bg-monchito-purple/5 hover:bg-monchito-purple/5 border-b border-monchito-purple/10">
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest h-12 w-[50px]"></TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Fecha</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Cliente</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Tipo</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Cuenta</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Comprobante</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right">Monto</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Operador</TableHead>
                            <TableHead className="text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map(t => {
                            const isIncome = t.movementType === 'INCOME'
                            return (
                                <TableRow 
                                    key={t.id} 
                                    className="border-b border-slate-50 hover:bg-monchito-purple/5 transition-all duration-200 cursor-pointer group"
                                    onClick={() => onView(t)}
                                >
                                    <TableCell className="py-4">
                                        {isIncome
                                            ? <ArrowDownCircle className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110" />
                                            : <ArrowUpCircle className="h-5 w-5 text-amber-600 transition-transform group-hover:scale-110" />
                                        }
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-xs font-medium text-slate-600">
                                            {format(new Date(t.date), "dd/MM/yyyy")}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-sm font-bold text-slate-800">
                                            {t.clientName || t.clientId}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        {getTypeBadge(t)}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-xs font-semibold text-slate-700">
                                            {t.bankAccountName || 'Sin cuenta'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="font-mono text-xs font-bold text-slate-700">
                                            {t.referenceNumber}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`py-4 text-right font-black text-sm ${isIncome ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {isIncome ? '+' : '-'}${t.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-xs font-medium text-slate-600">
                                            {t.createdBy}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onView(t)}
                                                title="Ver detalles"
                                                className="h-8 w-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
