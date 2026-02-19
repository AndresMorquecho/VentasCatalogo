
import { useLoyaltyRedemptions } from '../model/hooks';
import type { RedemptionStatus } from '../model/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';

const STATUS_STYLES: Record<RedemptionStatus, string> = {
    COMPLETADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
    CANCELADO: 'bg-red-100 text-red-700 border-red-200',
};

export function LoyaltyRedemptions() {
    const { redemptions, isLoading } = useLoyaltyRedemptions();

    if (isLoading) {
        return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">Historial de canjes realizados por los clientes.</p>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Cliente</TableHead>
                            <TableHead>Premio</TableHead>
                            <TableHead className="text-center">Puntos Usados</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {redemptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                                    No hay canjes registrados aún.
                                </TableCell>
                            </TableRow>
                        ) : (
                            redemptions.map(r => (
                                <TableRow key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell>
                                        <p className="font-medium text-slate-800">{r.clientName}</p>
                                        <p className="text-xs text-slate-400">{r.clientId}</p>
                                    </TableCell>
                                    <TableCell className="text-slate-700">{r.prizeName}</TableCell>
                                    <TableCell className="text-center font-bold text-amber-600">{r.pointsUsed} pts</TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(r.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={`text-xs border ${STATUS_STYLES[r.status]}`}>
                                            {r.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
