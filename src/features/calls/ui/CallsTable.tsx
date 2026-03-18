import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Eye } from 'lucide-react';
import { callResultsMap } from '@/entities/call';
import type { CallGroup } from '@/entities/call/model/api';
import { CallGroupDetailsModal } from './CallGroupDetailsModal';

const CALL_REASONS_MAP: Record<string, string> = {
    'REACTIVACION': 'Reactivación',
    'COBRANZA': 'Cobranza',
    'SEGUIMIENTO_PEDIDO': 'Seguimiento de Pedido',
    'OFERTA': 'Oferta',
    'OTRO': 'Otro'
};

interface CallsTableProps {
    groups: CallGroup[];
}

export function CallsTable({ groups }: CallsTableProps) {
    const [selectedGroup, setSelectedGroup] = useState<CallGroup | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleViewDetails = (group: CallGroup) => {
        setSelectedGroup(group);
        setIsDetailsOpen(true);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-EC', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    return (
        <>
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-xs font-bold text-slate-600">Fecha</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600">Motivo</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600">Usuario</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600">Cantidad</TableHead>
                            <TableHead className="text-right text-xs font-bold text-slate-600">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    No se encontraron llamadas registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            groups.map((group, index) => (
                                <TableRow key={`${group.date}-${group.reason}-${group.createdBy}-${index}`} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="whitespace-nowrap font-mono text-xs">
                                        {formatDate(group.date)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs bg-monchito-purple/10 px-2 py-1 rounded text-monchito-purple font-semibold">
                                            {CALL_REASONS_MAP[group.reason] || group.reason}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-700 font-medium">
                                        {group.createdBy}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-bold text-monchito-purple">
                                            {group.callCount} llamadas
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-monchito-purple hover:bg-monchito-purple/10"
                                            onClick={() => handleViewDetails(group)}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Ver Detalles
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CallGroupDetailsModal
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                group={selectedGroup}
            />
        </>
    );
}

