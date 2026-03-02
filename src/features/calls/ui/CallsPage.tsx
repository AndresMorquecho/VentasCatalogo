import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Phone, Plus } from 'lucide-react';
import { useCalls } from '../model/hooks';
import { CallFormModal } from './CallFormModal';
import { CallsTable } from './CallsTable';
import { PageHeader } from '@/shared/ui/PageHeader';

import {
    CALL_REASONS,
    CALL_RESULTS,
    callReasonsMap,
    callResultsMap,
    type Call
} from '@/entities/call';
import { useClients } from '@/entities/client/model/hooks';

export function CallsPage() {
    const { calls, isLoading, refetch } = useCalls();
    const { data: clients } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterReason, setFilterReason] = useState<string>('');
    const [filterResult, setFilterResult] = useState<string>('');
    const [filterDate, setFilterDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState<Call | undefined>(undefined);

    const handleCreate = () => {
        setSelectedCall(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (call: Call) => {
        setSelectedCall(call);
        setIsModalOpen(true);
    };

    const filteredCalls = calls.filter(call => {
        const client = clients?.find(c => c.id === call.clientId);
        const clientNameMatch = client ?
            (client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.identificationNumber.includes(searchTerm)) : false;

        const dateMatch = filterDate ? call.createdAt.startsWith(filterDate) : true;
        const reasonMatch = filterReason ? call.reason === filterReason : true;
        const resultMatch = filterResult ? call.result === filterResult : true;

        return (searchTerm === '' || clientNameMatch) && dateMatch && reasonMatch && resultMatch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-4">
            <PageHeader
                title="Registro de Llamadas"
                description="Gestiona y consulta el historial de llamadas a clientes de forma centralizada."
                icon={Phone}
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-1.5">
                        <Label htmlFor="date" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filtrar por Fecha</Label>
                        <Input
                            id="date"
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="filter-reason" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Motivo de Llamada</Label>
                        <select
                            id="filter-reason"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterReason}
                            onChange={(e) => setFilterReason(e.target.value)}
                        >
                            <option value="">Todos los motivos</option>
                            {CALL_REASONS.map(r => (
                                <option key={r} value={r}>{callReasonsMap[r] || r}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="filter-result" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resultado / Estado</Label>
                        <select
                            id="filter-result"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterResult}
                            onChange={(e) => setFilterResult(e.target.value)}
                        >
                            <option value="">Todos los resultados</option>
                            {CALL_RESULTS.map(r => (
                                <option key={r} value={r}>{callResultsMap[r] || r}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12 text-slate-400 font-medium">Cargando llamadas...</div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between pt-6 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1.5 rounded-full bg-monchito-purple" />
                            <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase text-[13px] tracking-widest font-monchito">
                                Historial de Contacto
                            </h2>
                        </div>
                        <Button onClick={handleCreate} className="bg-monchito-purple hover:bg-monchito-purple/90 shadow-md font-bold transition-all active:scale-95 h-10 px-6 rounded-xl">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Llamada
                        </Button>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <CallsTable calls={filteredCalls} onEdit={handleEdit} />
                    </div>
                </div>
            )}

            <CallFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                call={selectedCall}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
