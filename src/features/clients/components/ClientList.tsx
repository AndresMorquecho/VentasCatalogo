import { useState, useEffect } from "react";
import { useClientList, useDeleteClient } from "@/features/clients/api/hooks";
import type { Client } from "@/entities/client/model/types";
import { ClientTable } from "./ClientTable";
import { ClientForm } from "./ClientForm";
import { ClientDetailModal } from "./ClientDetailModal";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { AlertCircle, RotateCw, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/shared/ui/dialog";
import { useAuth } from "@/shared/auth";
import { logAction } from "@/shared/lib/auditService";
import { useNotifications } from "@/shared/lib/notifications";
import { useDebounce } from "@/shared/lib/hooks";
import { Pagination } from "@/shared/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import { Card, CardContent } from "@/shared/ui/card";
import { Filter, X, Loader2 } from "lucide-react";

export function ClientList({ triggerCreate, onTriggerHandled }: { 
    triggerCreate?: boolean;
    onTriggerHandled?: () => void;
}) {
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 1000);
    const [status, setStatus] = useState<string>("ALL");
    const [city, setCity] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const debouncedCity = useDebounce(city, 500);

    const { data: response, isLoading, isError, refetch } = useClientList({
        page,
        limit,
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
        status: status === "ALL" ? undefined : status,
        city: debouncedCity || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    const clients = response?.data || [];
    const pagination = response?.pagination;

    // Remove the limit: 500 fetch which causes slow loading
    // We will let the backend handle referential integrity during delete
    const deleteClientMutation = useDeleteClient();

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [viewingClient, setViewingClient] = useState<Client | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const { hasPermission, user } = useAuth();
    const { notifySuccess, notifyError } = useNotifications();

    // Reset page on filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, debouncedCity, startDate, endDate]);

    // Handle external trigger to open create form
    useEffect(() => {
        if (triggerCreate) {
            if (hasPermission('clients.create')) {
                setSelectedClient(null);
                setIsFormOpen(true);
            } else {
                notifyError({ message: 'No tienes permiso para crear empresarias' });
            }
            onTriggerHandled?.();
        }
    }, [triggerCreate]);

    const resetFilters = () => {
        setSearchQuery("");
        setStatus("ALL");
        setCity("");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    const handleEdit = (client: Client) => {
        if (!hasPermission('clients.edit')) {
            notifyError({ message: 'No tienes permiso para editar empresarias' });
            return;
        }
        setSelectedClient(client);
        setIsFormOpen(true);
    };

    const handleView = (client: Client) => {
        setViewingClient(client);
        setIsDetailOpen(true);
    };

    const handleDeleteRequest = (client: Client) => {
        if (!hasPermission('clients.delete')) {
            notifyError({ message: 'No tienes permiso para eliminar empresarias' });
            return;
        }
        setDeleteError(null);
        setDeleteTarget(client);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        const targetName = deleteTarget.firstName;
        const targetId = deleteTarget.identificationNumber;
        try {
            await deleteClientMutation.mutateAsync(deleteTarget.id);
            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'DELETE_CLIENT',
                    module: 'clients',
                    detail: `Eliminó empresaria: ${targetName} (ID: ${targetId})`
                });
            }
            notifySuccess(`Empresaria "${targetName}" eliminada correctamente`);
            setDeleteTarget(null);
        } catch (error: any) {
            // Extraer el mensaje limpio del backend (nunca mostrar texto técnico de Prisma)
            const backendMsg = error?.response?.data?.error?.message;
            const errorCode = error?.response?.data?.error?.code;

            if (backendMsg && (errorCode === 'REFERENTIAL_INTEGRITY' || errorCode === 'INTERNAL_ERROR')) {
                // El backend ya devolvió un mensaje legible
                setDeleteError(backendMsg);
            } else {
                // Fallback genérico amigable
                setDeleteError(`No se pudo eliminar a "${targetName}". Si el problema persiste, desactívela en su lugar.`);
            }
            setDeleteTarget(null);
        }
    };

    if (isError) {
        return (
            <div className="space-y-3 sm:space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <span>Ocurrió un error al cargar las empresarias.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="bg-background text-foreground hover:bg-accent border-destructive/50 w-full sm:w-auto"
                        >
                            <RotateCw className="mr-2 h-3 w-3" />
                            Reintentar
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">

            {/* Filters Bar */}
            <Card className="border-slate-200 bg-slate-50/30">
                <CardContent className="p-3 sm:p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="client-search"
                                placeholder="Buscar por cédula o nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 bg-white"
                            />
                        </div>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-10 bg-white">
                                <SelectValue placeholder="Estado (Actividad)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Cualquier Estado</SelectItem>
                                <SelectItem value="NEW">Nuevas (Sin pedidos)</SelectItem>
                                <SelectItem value="ACTIVE">Activas (Pedido {"<"} 30 días)</SelectItem>
                                <SelectItem value="INACTIVE">Inactivas (Pedido {">"} 30 días)</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filtrar por ciudad..."
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="pl-10 h-10 bg-white"
                            />
                            {city && (
                                <button 
                                    onClick={() => setCity("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Input
                                    type="date"
                                    className="h-10 text-xs bg-white"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    title="Registro Desde"
                                />
                            </div>
                            <div className="space-y-1">
                                <Input
                                    type="date"
                                    className="h-10 text-xs bg-white"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    title="Registro Hasta"
                                />
                            </div>
                        </div>
                    </div>

                    {(searchQuery || status !== "ALL" || city || startDate || endDate) && (
                        <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-[10px] h-7 uppercase font-bold tracking-wider hover:bg-red-50 hover:text-red-600">
                                <RotateCw className="h-3 w-3 mr-1.5" /> Limpiar Filtros
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error de eliminación por integridad referencial */}
            {deleteError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No se puede eliminar</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{deleteError}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteError(null)}
                            className="ml-4 bg-background text-foreground hover:bg-accent border-destructive/50"
                        >
                            Cerrar
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <ClientTable
                clients={clients}
                isLoading={isLoading}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDeleteRequest}
            />

            <ClientForm
                client={selectedClient}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />

            <ClientDetailModal
                client={viewingClient}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />

            {pagination && (
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open: boolean) => {
                    if (!open && !deleteClientMutation.isPending) setDeleteTarget(null);
                }}
            >
                <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] sm:w-full">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Confirmar Eliminación</DialogTitle>
                    </DialogHeader>
                    <p className="text-xs sm:text-sm text-muted-foreground py-3 sm:py-4">
                        ¿Está seguro que desea eliminar a{" "}
                        <strong>{deleteTarget?.firstName}</strong>? Esta acción no se puede
                        deshacer.
                    </p>
                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleteClientMutation.isPending}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleConfirmDelete} 
                            disabled={deleteClientMutation.isPending}
                            className="w-full sm:w-auto"
                        >
                            {deleteClientMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</>
                            ) : (
                                'Eliminar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
