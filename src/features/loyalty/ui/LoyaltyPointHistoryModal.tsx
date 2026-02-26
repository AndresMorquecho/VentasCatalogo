import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ShoppingBag, TrendingUp, Calendar, Info } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { useLoyaltyHistory } from '../model/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

interface LoyaltyPointHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    clientName: string;
}

export function LoyaltyPointHistoryModal({ open, onOpenChange, clientId, clientName }: LoyaltyPointHistoryModalProps) {
    const { data: history = [], isLoading } = useLoyaltyHistory(clientId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Historial de Puntos - {clientName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-slate-500">
                        Registro detallado de los puntos obtenidos a través de pedidos realizados.
                    </p>

                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Info className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">No se registran acumulaciones de puntos aún.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>N° Pedido</TableHead>
                                        <TableHead className="text-right">Monto Pedido</TableHead>
                                        <TableHead className="text-right">Puntos Ganados</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {new Date(item.appliedAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-800">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
                                                        {item.order?.receiptNumber || `ID: ${item.order?.id?.substring(0, 8)}`}
                                                    </div>
                                                    {!item.order?.receiptNumber && item.order?.invoiceNumber && (
                                                        <span className="text-[10px] text-slate-400 ml-5">Factura: {item.order.invoiceNumber}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-700 font-semibold">
                                                ${Number(item.order?.total || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                    <TrendingUp className="h-3.5 w-3.5" />
                                                    +{item.pointsEarned} pts
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
