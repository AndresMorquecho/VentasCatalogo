import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { callResultsMap } from '@/entities/call';
import type { CallGroup } from '@/entities/call/model/api';
import { useClients } from '@/entities/client/model/hooks';

const CALL_REASONS_MAP: Record<string, string> = {
    'REACTIVACION': 'Reactivación',
    'COBRANZA': 'Cobranza',
    'SEGUIMIENTO_PEDIDO': 'Seguimiento de Pedido',
    'OFERTA': 'Oferta',
    'OTRO': 'Otro'
};

interface CallGroupDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: CallGroup | null;
}

export function CallGroupDetailsModal({ open, onOpenChange, group }: CallGroupDetailsModalProps) {
    const { data: clientsResponse } = useClients();
    const clients = clientsResponse?.data || [];

    if (!group) return null;

    const getClientName = (id: string) => {
        const client = clients?.find(c => c.id === id);
        return client ? `${client.firstName} (${client.identificationNumber})` : id;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-EC', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-EC', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-monchito-purple">
                        Detalles del Grupo de Llamadas
                    </DialogTitle>
                    <div className="flex items-center gap-3 text-sm text-slate-600 mt-2">
                        <Badge className="bg-monchito-purple/10 text-monchito-purple">
                            {CALL_REASONS_MAP[group.reason] || group.reason}
                        </Badge>
                        <span>•</span>
                        <span className="font-semibold">{formatDate(group.date)}</span>
                        <span>•</span>
                        <span>Registrado por: <span className="font-semibold">{group.createdBy}</span></span>
                        <span>•</span>
                        <span className="font-bold text-monchito-purple">{group.callCount} llamadas</span>
                    </div>
                </DialogHeader>

                <div className="mt-4 rounded-md border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="text-xs font-bold text-slate-600">Hora</TableHead>
                                <TableHead className="text-xs font-bold text-slate-600">Cliente</TableHead>
                                <TableHead className="text-xs font-bold text-slate-600">Resultado</TableHead>
                                <TableHead className="text-xs font-bold text-slate-600">Observaciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {group.calls.map((call) => (
                                <TableRow key={call.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                                        {formatTime(call.createdAt)}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm text-slate-700">
                                        {getClientName(call.clientId)}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                            call.result === 'CONTESTA' || call.result === 'PAGO_PROMETIDO' || call.result === 'INTERESADO'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {callResultsMap[call.result] || call.result}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] text-xs text-slate-600">
                                        {call.notes || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
