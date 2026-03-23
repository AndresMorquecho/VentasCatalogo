import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ShoppingBag, Trophy, Calendar, Info, CheckCircle2, Clock, TrendingUp, Gift } from 'lucide-react';
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
    const [expandedRule, setExpandedRule] = useState<string | null>(null);

    const fmt = (n: number) => n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

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
                          3>
                                <div className="space-y-3">
                                    {ruleProgress.map((rule: any) => (
                                        <div key=erald-50/40' : 'border-slate-200 bg-white'}`}>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rule.ruleName}</p>
                                                    <p className="font-bold text-slate-800 text-sm">{rule.prizeName || 'Premio'}</p>
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

                            {pagination && (
                                <Pagination
                                    currentPage={page}
                                    totalPages={pagination.pages}
                                    onPageChange={setPage}
                                    totalItems={pagination.total}
                                    itemsPerPage={limit}
                                />
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>

    );
}
