
import { useLoyaltyRedemptions } from '../model/hooks';
import type { RedemptionStatus } from '../model/types';
import { useClients } from '@/entities/client/model/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';

const STATUS_STYLES: Record<RedemptionStatus, string> = {
    COMPLETADO: 'bg-[#20a29a]/10 text-[#20a29a] border-[#20a29a]/20',
    PENDIENTE: 'bg-[#f0cd23]/10 text-[#570d64] border-[#f0cd23]/20',
    CANCELADO: 'bg-red-50 text-red-600 border-red-100',
};

export function LoyaltyRedemptions() {
    const { redemptions, isLoading } = useLoyaltyRedemptions();
    const { data: clients = [] } = useClients();

    // Helper to get client identification
    const getClientIdentification = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client?.identificationNumber || clientId;
    };

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
                            <TableHead>Autorizado por</TableHead>
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
                                        <p className="text-xs text-slate-400">{getClientIdentification(r.clientId)}</p>
                                    </TableCell>
                                    <TableCell className="text-slate-700">{r.prizeName}</TableCell>
                                    <TableCell className="text-center font-bold text-[#f0cd23]">{r.pointsUsed} pts</TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(r.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm italic">
                                        {r.authorName || 'Sistema'}
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
