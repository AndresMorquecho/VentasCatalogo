import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
    type Call,
    callReasonsMap,
    callResultsMap,
    useDeleteCall
} from '@/entities/call';
import { useClients } from '@/entities/client/model/hooks';
import { useAuth } from '@/shared/auth';
import { useToast } from '@/shared/ui/use-toast';

interface CallsTableProps {
    calls: Call[];
    onEdit: (call: Call) => void;
}

export function CallsTable({ calls, onEdit }: CallsTableProps) {
    const { data: clients } = useClients();
    const { mutateAsync: deleteCall } = useDeleteCall();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();

    const getClientName = (id: string) => {
        const client = clients?.find(c => c.id === id);
        return client ? `${client.firstName} ${client.identificationNumber}` : id;
    };

    const handleDelete = async (id: string) => {
        if (!hasPermission('calls.create')) {
            showToast('No tienes permiso para eliminar llamadas', 'error');
            return;
        }
        if (window.confirm('¿Estás seguro de que deseas eliminar este registro de llamada?')) {
            try {
                await deleteCall(id);
            } catch (error) {
                console.error("Error deleting call", error);
            }
        }
    };

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Observaciones</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {calls.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                No se encontraron llamadas registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        calls.map((call) => (
                            <TableRow key={call.id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="whitespace-nowrap font-mono text-xs">
                                    {new Date(call.createdAt).toLocaleString('es-EC')}
                                </TableCell>
                                <TableCell className="font-medium text-slate-700">
                                    {getClientName(call.clientId)}
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                        {callReasonsMap[call.reason] || call.reason}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${call.result === 'CONTESTA' || call.result === 'PAGO_PROMETIDO' || call.result === 'INTERESADO'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {callResultsMap[call.result] || call.result}
                                    </span>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">
                                    <div className="flex flex-col gap-0.5">
                                        <span title="Registrado por">{call.createdBy}</span>
                                        {call.updatedBy && call.updatedBy !== call.createdBy && (
                                            <span className="text-slate-400 italic" title="Editado por">✎ {call.updatedBy}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-xs text-slate-600" title={call.notes || ''}>
                                    {call.notes || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => {
                                                if (!hasPermission('calls.create')) {
                                                    showToast('No tienes permiso para editar llamadas', 'error');
                                                    return;
                                                }
                                                onEdit(call);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(call.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
