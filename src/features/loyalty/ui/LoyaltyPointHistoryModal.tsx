import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ShoppingBag, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Badge } from '@/shared/ui/badge';
import { useLoyaltyHistory } from '../model/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Pagination } from '@/shared/ui/pagination';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    clientName: string;
}

export function LoyaltyPointHistoryModal({ open, onOpenChange, clientId, clientName }: Props) {
    const [page, setPage] = useState(1);
    const { ruleProgress, redemptionHistory, pagination, isLoading } = useLoyaltyHistory(clientId, { page, limit: 20 });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-monchito-purple" />
                        Historial de Fidelización — {clientName}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-3 py-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                    </div>
                ) : (
                    <div className="space-y-6 py-2">

                        {/* ── Progreso actual por regla ── */}
                        {ruleProgress.length > 0 && (
                            <section>
                                <div className="space-y-3">
                                    {ruleProgress.map((rule: any) => (
                                        <div key={rule.ruleId} className="p-4 rounded-xl border border-slate-200 bg-white">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rule.ruleName}</p>
                                                    <p className="font-bold text-slate-800 text-sm">{rule.prizeName || 'Premio'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── Historial de puntos ── */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-monchito-purple" />
                                    Detalle de Puntos Ganados
                                </h3>
                                <Badge variant="outline" className="text-[10px] font-bold">
                                    {pagination?.total || 0} registros
                                </Badge>
                            </div>

                            <div className="border rounded-xl overflow-hidden bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[120px]">Fecha</TableHead>
                                            <TableHead>Orden / Referencia</TableHead>
                                            <TableHead className="text-right">Valor Total</TableHead>
                                            <TableHead className="text-right">Puntos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {redemptionHistory.map((item: any) => (
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

                            {pagination && (
                                <Pagination
                                    currentPage={page}
                                    totalPages={pagination.pages}
                                    onPageChange={setPage}
                                    totalItems={pagination.total}
                                    itemsPerPage={20}
                                />
                            )}
                        </section>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
