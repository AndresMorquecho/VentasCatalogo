import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Plus, Search, Phone } from 'lucide-react';
import { useGroupedCalls } from '@/entities/call/model/hooks';
import { CallTypeSelectionModal } from './CallTypeSelectionModal';
import { CallsTable } from './CallsTable';
import { useDebounce } from '@/shared/lib/hooks';
import { PageHeader } from '@/shared/ui/PageHeader';

import {
    CALL_RESULTS,
    callResultsMap
} from '@/entities/call';

// Motivos actualizados
const CALL_REASONS_MAP: Record<string, string> = {
    'REACTIVACION': 'Reactivación',
    'COBRANZA': 'Cobranza'
};

export function CallsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 1000);

    const [filterReason, setFilterReason] = useState<string>('');
    const [filterResult, setFilterResult] = useState<string>('');
    const [filterDate, setFilterDate] = useState('');

    const { data: groups, isLoading } = useGroupedCalls({
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
        reason: filterReason || undefined,
        result: filterResult || undefined,
    });

    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Registro de Llamadas" 
                description="Gestiona y consulta el historial de llamadas a clientes"
                icon={Phone}
                actions={
                    <Button 
                        onClick={() => setIsTypeModalOpen(true)} 
                        className="bg-monchito-purple hover:bg-monchito-purple/90"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nueva Llamada
                    </Button>
                }
            />

            <div className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-4 items-end">
                    <div className="grid gap-2">
                        <Label htmlFor="search" className="text-xs font-medium text-slate-600">Buscar Cliente</Label>
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
                        <Label htmlFor="date" className="text-xs font-medium text-slate-600">Fecha</Label>
                        <Input
                            id="date"
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="filter-reason" className="text-xs font-medium text-slate-600">Motivo</Label>
                        <select
                            id="filter-reason"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monchito-purple focus-visible:ring-offset-2"
                            value={filterReason}
                            onChange={(e) => setFilterReason(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {Object.entries(CALL_REASONS_MAP).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="filter-result" className="text-xs font-medium text-slate-600">Resultado</Label>
                        <select
                            id="filter-result"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monchito-purple focus-visible:ring-offset-2"
                            value={filterResult}
                            onChange={(e) => setFilterResult(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {CALL_RESULTS.map(r => (
                                <option key={r} value={r}>{callResultsMap[r] || r}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">Cargando...</div>
            ) : (
                <CallsTable groups={groups || []} />
            )}

            <CallTypeSelectionModal
                open={isTypeModalOpen}
                onOpenChange={setIsTypeModalOpen}
            />
        </div>
    );
}

