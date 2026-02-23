import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import type { Call } from '@/entities/call';
import { useClients } from '@/entities/client/model/hooks';


interface CallsTableProps {
    calls: Call[];
}

export function CallsTable({ calls }: CallsTableProps) {
    const { data: clients } = useClients();

    const getClientName = (id: string) => {
        const client = clients?.find(c => c.id === id);
        return client ? `${client.firstName} ${client.identificationNumber}` : id;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Observaciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {calls.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No se encontraron llamadas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        calls.map((call) => (
                            <TableRow key={call.id}>
                                <TableCell>{new Date(call.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{getClientName(call.clientId)}</TableCell>
                                <TableCell>{call.reason}</TableCell>
                                <TableCell>{call.result}</TableCell>
                                <TableCell>{call.createdBy}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={call.notes || ''}>
                                    {call.notes}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
