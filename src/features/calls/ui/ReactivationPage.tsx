import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Search, Phone, Clock, ArrowLeft } from 'lucide-react';
import { useClientList } from '@/features/clients/api/hooks';
import { useDebounce } from '@/shared/lib/hooks';
import { Pagination } from '@/shared/ui/pagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { differenceInDays } from 'date-fns';
import type { Client } from '@/entities/client/model/types';
import { useNavigate } from 'react-router-dom';
import { CallFormModal } from './CallFormModal';

export function ReactivationPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 1000);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    // Reset page on search
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleCallClick = (client: Client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Reactivación de Clientes" 
                description={`${clients.length} clientes inactivas disponibles para llamar`}
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
            ) : clients.length === 0 ? (
                <div className="bg-white rounded-lg border p-12 text-center">
                    <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-600">No hay clientes disponibles</p>
                    <p className="text-sm text-slate-400 mt-2">Todas las clientes inactivas ya fueron llamadas hoy</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="grid gap-1 p-2">
                        {clients.map((client) => {
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

            <CallFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                initialClient={selectedClient || undefined}
                initialReason="REACTIVACION"
                onSuccess={() => {
                    refetch();
                }}
            />
        </div>
    );
}
