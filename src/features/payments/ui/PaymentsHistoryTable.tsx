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
    createdBy?: string;
    financialRecords?: FinancialRecord[];
}

const METHOD_LABELS: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TRANSFERENCIA: 'Transferencia',
    DEPOSITO: 'Depósito',
    CHEQUE: 'Cheque',
    BILLETERA_VIRTUAL: 'Billetera Virtual',
    CREDITO_CLIENTE: 'Crédito Cliente',
    SPLIT_PAYMENT: 'Pago Dividido',
    CAMBIO: 'Nota de Crédito/Cambio'
};

interface OrderMetadata {
    createdAt: string;
    createdBy?: string;
    receiptNumber: string;
}

interface Props {
    payments: Payment[];
    orderTotal?: number;
    onDelete?: (paymentId: string) => void;
    readOnly?: boolean;
    orderMetadata?: OrderMetadata;
}

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
        createdBy: payment.createdBy,
        amount: payment.amount,
        paymentId: payment.id,
        isSplitChild: false,
    }];
}

export function PaymentsHistoryTable({ payments, orderTotal, onDelete, readOnly = false, orderMetadata }: Props) {


    const allRows = payments.flatMap(buildRows);

    return (
        <div className="border rounded-md overflow-hidden bg-white/50 backdrop-blur-sm">
            <Table>
                <TableHeader className="bg-slate-50/80">
                    <TableRow>
                        <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">N° Abono</TableHead>
                        <TableHead className="w-[110px] text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Fecha Hora</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Método</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Ref./Banc</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Reg. Por</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Obs.</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Monto</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-emerald-600 font-bold">Abono</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-monchito-purple font-bold">Saldo</TableHead>
                        {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(() => {
                        const baseTotal = Number(orderTotal || 0);
                        
                        // Create initial debt row
                        const initialRow = (
                            <TableRow key="initial-debt" className="bg-slate-50/30">
                                <TableCell className="font-black text-slate-400 text-xs">-</TableCell>
                                <TableCell className="font-mono text-[10px] text-slate-400">
                                    {orderMetadata?.createdAt ? new Date(orderMetadata.createdAt).toLocaleString('es-EC', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : '-'}
                                </TableCell>
                                <TableCell className="text-[10px] text-slate-400">-</TableCell>
                                <TableCell className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                    {orderMetadata?.receiptNumber || '-'}
                                </TableCell>
                                <TableCell className="text-[10px] text-slate-500 italic font-bold">
                                    {orderMetadata?.createdBy || 'Sistema'}
                                </TableCell>
                                <TableCell className="text-[10px] text-slate-600 font-bold italic">Deuda Inicial</TableCell>
                                <TableCell className="text-right font-black text-slate-700 text-sm">
                                    ${baseTotal.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-slate-300">-</TableCell>
                                <TableCell className="text-right font-black text-slate-900 text-sm">
                                    ${baseTotal.toFixed(2)}
                                </TableCell>
                                {!readOnly && <TableCell></TableCell>}
                            </TableRow>
                        );

                        const paymentRows = allRows.map((row, idx) => {
                            // Calculate current saldo: baseTotal minus sum of all payments up to this row
                            const totalPaidUpToThis = allRows
                                .slice(0, idx + 1)
                                .reduce((acc, r) => acc + Number(r.amount || 0), 0);
                            const rowSaldo = baseTotal - totalPaidUpToThis;

                            return (
                                <TableRow key={row.key} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-black text-monchito-purple text-xs">
                                        {`AB${String(idx + 1).padStart(3, '0')}`}
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
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter bg-slate-50">
                                            {formatMethod(row.method)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 truncate max-w-[100px] font-medium">
                                        {row.bankAccountName || row.reference || '-'}
                                    </TableCell>
                                    <TableCell className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[80px]">
                                        {row.createdBy || '-'}
                                    </TableCell>
                                    <TableCell className="text-[10px] text-slate-400 italic max-w-[120px] truncate">
                                        {row.notes?.replace(' (fila 1)', '') || '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-300">-</TableCell>
                                    <TableCell className="text-right font-black text-emerald-600 text-sm">
                                        ${Number(row.amount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-black text-monchito-purple text-sm">
                                        ${rowSaldo.toFixed(2)}
                                    </TableCell>
                                    {!readOnly && (
                                        <TableCell>
                                            {!row.isSplitChild && idx === allRows.length - 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg group"
                                                    onClick={() => onDelete?.(row.paymentId)}
                                                >
                                                    <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        });

                        return [initialRow, ...paymentRows];
                    })()}
                </TableBody>
            </Table>
        </div>
    );
}

