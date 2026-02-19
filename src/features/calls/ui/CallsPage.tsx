
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Plus, Search } from 'lucide-react';
import { useCalls } from '../model/hooks';
import { CallFormModal } from './CallFormModal';
import { CallsTable } from './CallsTable';

import { CALL_REASONS, CALL_RESULTS } from '@/entities/call-record/model/model';
import { useClients } from '@/entities/client/model/hooks';

export function CallsPage() {
    const { calls, isLoading, refetch } = useCalls();
    const { data: clients } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterReason, setFilterReason] = useState<string>('');
    const [filterResult, setFilterResult] = useState<string>('');
    const [filterDate, setFilterDate] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        <div className="space-y-6 container mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Registro de Llamadas</h1>
                    <p className="text-muted-foreground">Gestiona y consulta el historial de llamadas a clientes.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Llamada
                </Button>
            </div>

            <div className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-4 items-end">
                    <div className="grid gap-2">
                        <Label htmlFor="search">Buscar Cliente</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Nombre o Cédula..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input
                            id="date"
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="filter-reason">Motivo</Label>
                        <select
                            id="filter-reason"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterReason}
                            onChange={(e) => setFilterReason(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {CALL_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="filter-result">Resultado</Label>
                        <select
                            id="filter-result"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterResult}
                            onChange={(e) => setFilterResult(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {CALL_RESULTS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">Cargando...</div>
            ) : (
                <CallsTable calls={filteredCalls} />
            )}

            <CallFormModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
