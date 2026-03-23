import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Trash2 } from "lucide-react";

interface FinancialRecord {
    id: string;
    paymentMethod: string;
    amount: number;
    bankAccountId?: string;
    bankAccountName?: string;
    notes?: string;
    createdBy?: string;
    referenceNumber?: string;
}

interface Payment {
    id: string;
    amount: number;
    date: string;
    method: string;
    reference?: string;
    receiptNumber?: string;
    description?: string;
    financialRecords?: FinancialRecord[];
}

interface Props {
    payments: Payment[];
    onDelete?: (paymentId: string) => void;
    readOnly?: boolean;
}

const METHOD_LABELS: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TRANSFERENCIA: 'Transferencia',
    DEPOSITO: 'Depósito',
    CHEQUE: 'Cheque',
    BILLETERA_VIRTUAL: 'Billetera Virtual',
    CREDITO_CLIENTE: 'Crédito Cliente',
    SPLIT_PAYMENT: 'Pago Dividido',
};

function formatMethod(method: string): string {
    return METHOD_LABELS[method] || method;
}

/**
 * Build display rows from a payment.
 * - SPLIT_PAYMENT with financialRecords → expand into one row per FR (real method)
 * - SPLIT_PAYMENT without FRs → show as-is (fallback)
 * - Any other method → single row
 */
function buildRows(payment: Payment): Array<{
    key: string;
    receiptNumber?: string;
    date: string;
    method: string;
    bankAccountName?: string;
    reference?: string;
    notes?: string;
    createdBy?: string;
    amount: number;
    paymentId: string;
    isSplitChild: boolean;
}> {
    if (payment.method === 'SPLIT_PAYMENT' && payment.financialRecords && payment.financialRecords.length > 0) {
        return payment.financialRecords.map((fr, idx) => ({
            key: `${payment.id}-fr-${fr.id}`,
            receiptNumber: payment.receiptNumber,
            date: payment.date,
            method: fr.paymentMethod,
            bankAccountName: fr.bankAccountName,
            reference: fr.referenceNumber,
            notes: fr.notes,
            createdBy: fr.createdBy,
            amount: fr.amount,
            paymentId: payment.id,
            isSplitChild: idx > 0, // only show delete on first row
        }));
    }

    return [{
        key: payment.id,
        receiptNumber: payment.receiptNumber,
        date: payment.date,
        method: payment.method,
        reference: payment.reference,
        notes: payment.description,
        amount: payment.amount,
        paymentId: payment.id,
        isSplitChild: false,
    }];
}

export function PaymentsHistoryTable({ payments, onDelete, readOnly = false }: Props) {
    if (payments.length === 0) {
        return (
            <div className="text-center py-6 text-slate-400 text-sm italic">
                No hay abonos registrados para este pedido.
            </div>
        );
    }

    const allRows = payments.flatMap(buildRows);

    return (
        <div className="border rounded-md overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[80px]">N° Abono</TableHead>
                        <TableHead className="w-[130px]">Fecha / Hora</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Cuenta / Banco</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allRows.map((row) => (
                        <TableRow key={row.key}>
                            <TableCell className="font-bold text-emerald-700 text-xs">
                                {row.isSplitChild ? '' : (row.receiptNumber || '-')}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-slate-500">
                                {new Date(row.date).toLocaleString('es-EC', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] font-bold">
                                    {formatMethod(row.method)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 truncate max-w-[120px]">
                                {row.bankAccountName || '-'}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 truncate max-w-[100px]">
                                {row.reference || '-'}
                            </TableCell>
                            <TableCell className="text-xs text-slate-400">
                                {row.createdBy || '-'}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-700">
                                ${row.amount.toFixed(2)}
                            </TableCell>
                            {!readOnly && (
                                <TableCell>
                                    {!row.isSplitChild && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => onDelete?.(row.paymentId)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
