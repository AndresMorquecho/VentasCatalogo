import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Trash2 } from "lucide-react";

interface Payment {
    id: string;
    amount: number;
    date: string;
    method: string;
    reference?: string;
    receiptNumber?: string;
}

interface Props {
    payments: Payment[];
    onDelete?: (paymentId: string) => void;
    readOnly?: boolean;
}

export function PaymentsHistoryTable({ payments, onDelete, readOnly = false }: Props) {
    if (payments.length === 0) {
        return (
            <div className="text-center py-6 text-slate-400 text-sm italic">
                No hay abonos registrados para este pedido.
            </div>
        );
    }

    return (
        <div className="border rounded-md overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[80px]">N° Abono</TableHead>
                        <TableHead className="w-[140px]">Fecha / Hora</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((p) => (
                        <TableRow key={p.id}>
                            <TableCell className="font-bold text-emerald-700 text-xs">
                                {p.receiptNumber || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-slate-500">
                                {new Date(p.date).toLocaleString('es-EC', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit',
                                    hour: '2-digit', 
                                    minute: '2-digit'
                                })}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] font-bold">
                                    {p.method}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 truncate max-w-[100px]">
                                {p.reference || '-'}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-700">
                                ${p.amount.toFixed(2)}
                            </TableCell>
                            {!readOnly && (
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => onDelete?.(p.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
