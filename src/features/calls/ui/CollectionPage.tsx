import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Search, Phone, DollarSign, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useClientList } from '@/features/clients/api/hooks';
import { useCreateCall } from '@/entities/call/model/hooks';
import { useDebounce } from '@/shared/lib/hooks';
import { Pagination } from '@/shared/ui/pagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import type { Client } from '@/entities/client/model/types';
import type { CallResult } from '@/entities/call/model/types';
import { callResultsMap, CALL_RESULTS } from '@/entities/call';
import { useNotifications } from '@/shared/lib/notifications';
import { useNavigate } from 'react-router-dom';

export function CollectionPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 1000);
    const { notifySuccess, notifyError } = useNotifications();
    const { mutateAsync: createCall } = useCreateCall();
    const [expandedClient, setExpandedClient] = useState<string | null>(null);

    // Fetch clients with pending payments excluding those called today with COBRANZA reason
    const { data: response, isLoading, refetch } = useClientList({
        page,
        limit,
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
        withPendingPayments: true,
        excludeCalledToday: true,
        callReason: 'COBRANZA'
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
            await createCall({
                clientId: selectedClient.id,
                reason: 'COBRANZA',
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

    const toggleExpand = (clientId: string) => {
        setExpandedClient(expandedClient === clientId ? null : clientId);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-EC', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
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
        <div className="space-y-6">
            <PageHeader 
                title="Cobranza" 
                description={`${clients.length} clientes con pagos pendientes`}
                icon={DollarSign}
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
            ) : clients.length === 0 ? (
                <div className="bg-white rounded-lg border p-12 text-center">
                    <DollarSign className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-600">No hay clientes con deudas pendientes</p>
                    <p className="text-sm text-slate-400 mt-2">Todos los clientes con deudas ya fueron llamados hoy</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="grid gap-1 p-2">
                        {clients.map((client) => {
                            const isExpanded = expandedClient === client.id;
                            const totalDebt = client.totalDebt || 0;
                            
                            return (
                                <div
                                    key={client.id}
                                    className="rounded-lg border transition-all border-slate-200 hover:border-slate-300"
                                >
                                    <div className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-sm font-bold text-slate-800">
                                                        {client.firstName}
                                                    </h3>
                                                    <Badge className="bg-red-100 text-red-700 text-xs">
                                                        Deuda: {formatCurrency(totalDebt)}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600">
                                                    <span className="font-mono font-semibold">{client.identificationNumber}</span>
                                                    <span className="text-slate-400">•</span>
                                                    <span>{client.city}</span>
                                                    <span className="text-slate-400">•</span>
                                                    <Badge variant="outline" className="text-xs bg-slate-50">
                                                        {client.phone1}
                                                    </Badge>
                                                    {client.debts && client.debts.length > 0 && (
                                                        <>
                                                            <span className="text-slate-400">•</span>
                                                            <span className="text-amber-600 font-semibold">
                                                                {client.debts.length} pedido{client.debts.length > 1 ? 's' : ''} pendiente{client.debts.length > 1 ? 's' : ''}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {client.debts && client.debts.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpand(client.id)}
                                                        className="text-slate-600 hover:text-monchito-purple"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => handleCallClick(client)}
                                                    className="bg-monchito-purple hover:bg-monchito-purple/90"
                                                >
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    Llamar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Debt Details */}
                                    {isExpanded && client.debts && client.debts.length > 0 && (
                                        <div className="border-t bg-slate-50 p-4">
                                            <h4 className="text-xs font-bold text-slate-700 mb-3">Detalles de Deudas</h4>
                                            <div className="space-y-2">
                                                {client.debts.map((debt) => (
                                                    <div
                                                        key={debt.orderId}
                                                        className="bg-white rounded border border-slate-200 p-3"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-bold text-slate-700">
                                                                        Pedido #{debt.receiptNumber}
                                                                    </span>
                                                                    <Badge className="text-xs bg-monchito-purple/10 text-monchito-purple">
                                                                        {debt.brandName}
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    Fecha: {formatDate(debt.transactionDate)}
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <div className="text-xs text-slate-500">Total: {formatCurrency(debt.total)}</div>
                                                                <div className="text-xs text-emerald-600">Pagado: {formatCurrency(debt.paid)}</div>
                                                                <div className="text-sm font-bold text-red-600">
                                                                    Pendiente: {formatCurrency(debt.pending)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
