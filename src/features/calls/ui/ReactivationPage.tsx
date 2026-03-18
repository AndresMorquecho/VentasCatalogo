import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Search, Phone, Clock, ArrowLeft } from 'lucide-react';
import { useClientList } from '@/features/clients/api/hooks';
import { useCreateCall } from '@/entities/call/model/hooks';
import { useDebounce } from '@/shared/lib/hooks';
import { Pagination } from '@/shared/ui/pagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { differenceInDays } from 'date-fns';
import type { Client } from '@/entities/client/model/types';
import type { CallResult } from '@/entities/call/model/types';
import { callResultsMap, CALL_RESULTS } from '@/entities/call';
import { useNotifications } from '@/shared/lib/notifications';
import { useNavigate } from 'react-router-dom';

export function ReactivationPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 1000);
    const { notifySuccess, notifyError } = useNotifications();
    const { mutateAsync: createCall } = useCreateCall();

    // Fetch inactive clients excluding those called today with REACTIVACION reason
    const { data: response, isLoading, refetch } = useClientList({
        page,
        limit,
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
        status: 'INACTIVE',
        excludeCalledToday: true,
        callReason: 'REACTIVACION'
    });

    const clients = response?.data || [];
    const pagination = response?.pagination;

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [result, setResult] = useState<CallResult>('NO_CONTESTA');
    const [notes, setNotes] = useState('');

    // Reset page on search
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleCallClick = (client: Client) => {
        setSelectedClient(client);
        setResult('NO_CONTESTA');
        setNotes('');
    };

    const handleSaveCall = async () => {
        if (!selectedClient) return;

        try {
            // Save call immediately to backend
            await createCall({
                clientId: selectedClient.id,
                reason: 'REACTIVACION',
                result,
                notes: notes || null
            });
            
            notifySuccess(`Llamada a ${selectedClient.firstName} registrada`);
            setSelectedClient(null);
            setNotes('');
            
            // Refetch to update the list (backend will exclude this client now)
            refetch();
        } catch (error) {
            console.error('Error saving call:', error);
            notifyError(error, 'Error al guardar la llamada');
        }
    };

    // Filter out clients already called today
    const availableClients = clients;

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Reactivación de Clientes" 
                description={`${availableClients.length} clientes inactivas disponibles para llamar`}
                icon={Phone}
                actions={
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/calls')}
                        className="border-slate-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                }
            />

            {/* Search Bar */}
            <div className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="grid gap-2">
                    <Label htmlFor="search" className="text-xs font-medium text-slate-600">Buscar Cliente</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="search"
                            placeholder="Nombre o Cédula..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Client List */}
            {isLoading ? (
                <div className="flex justify-center p-12 text-slate-500">Cargando clientes...</div>
            ) : availableClients.length === 0 ? (
                <div className="bg-white rounded-lg border p-12 text-center">
                    <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-600">No hay clientes disponibles</p>
                    <p className="text-sm text-slate-400 mt-2">Todas las clientes inactivas ya fueron llamadas hoy</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="grid gap-1 p-2">
                        {availableClients.map((client) => {
                            const lastOrder = client.lastOrderDate ? new Date(client.lastOrderDate) : null;
                            const daysSinceOrder = lastOrder ? differenceInDays(new Date(), lastOrder) : null;
                            
                            return (
                                <div
                                    key={client.id}
                                    className={`
                                        p-4 rounded-lg border transition-all border-slate-200 hover:border-slate-300 hover:bg-slate-50
                                    `}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-sm font-bold text-slate-800">
                                                    {client.firstName}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600">
                                                <span className="font-mono font-semibold">{client.identificationNumber}</span>
                                                <span className="text-slate-400">•</span>
                                                <span>{client.city}</span>
                                                <span className="text-slate-400">•</span>
                                                <Badge variant="outline" className="text-xs bg-slate-50">
                                                    {client.phone1}
                                                </Badge>
                                                {daysSinceOrder && (
                                                    <>
                                                        <span className="text-slate-400">•</span>
                                                        <span className="text-amber-600 font-semibold">
                                                            {daysSinceOrder} días sin pedido
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {client.lastBrandName && (
                                                <p className="text-xs text-monchito-purple font-semibold mt-1">
                                                    Último catálogo: {client.lastBrandName}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => handleCallClick(client)}
                                            className="shrink-0 bg-monchito-purple hover:bg-monchito-purple/90"
                                        >
                                            <Phone className="mr-2 h-4 w-4" />
                                            Llamar
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {pagination && (
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            )}

            {/* Quick Call Form - Appears when client is selected */}
            {selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-monchito-purple mb-4">
                            Registrar llamada a {selectedClient.firstName}
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="result" className="text-xs font-medium text-slate-600">
                                    Resultado
                                </Label>
                                <select
                                    id="result"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monchito-purple"
                                    value={result}
                                    onChange={(e) => setResult(e.target.value as CallResult)}
                                >
                                    {CALL_RESULTS.map(r => (
                                        <option key={r} value={r}>{callResultsMap[r]}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes" className="text-xs font-medium text-slate-600">
                                    Observaciones (opcional)
                                </Label>
                                <textarea
                                    id="notes"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monchito-purple"
                                    placeholder="Detalles de la llamada..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedClient(null)}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSaveCall}
                                    className="flex-1 bg-monchito-purple hover:bg-monchito-purple/90"
                                >
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
