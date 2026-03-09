import { useState, useEffect } from "react";
import { useClientList, useDeleteClient } from "@/features/clients/api/hooks";
import { useOrderList } from "@/entities/order/model/hooks";
import { canDeleteClient } from "@/entities/client/model/model";
import type { Client } from "@/entities/client/model/types";
import { ClientTable } from "./ClientTable";
import { ClientForm } from "./ClientForm";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { AlertCircle, Plus, RotateCw, Search } from "lucide-react";
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

export function ClientList() {
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 1000);

    const { data: response, isLoading, isError, refetch } = useClientList({
        page,
        limit,
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
    });

    const clients = response?.data || [];
    const pagination = response?.pagination;

    const { data: ordersResponse } = useOrderList({ limit: 500 }); // Large limit for integrity check
    const orders = ordersResponse?.data || [];
    const deleteClientMutation = useDeleteClient();

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const { hasPermission, user } = useAuth();
    const { notifySuccess, notifyError } = useNotifications();

    // Reset page on search
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleCreate = () => {
        if (!hasPermission('clients.create')) {
            notifyError({ message: 'No tienes permiso para crear empresarias' });
            return;
        }
        setSelectedClient(null);
        setIsFormOpen(true);
    };

    const handleEdit = (client: Client) => {
        if (!hasPermission('clients.edit')) {
            notifyError({ message: 'No tienes permiso para editar empresarias' });
            return;
        }
        setSelectedClient(client);
        setIsFormOpen(true);
    };

    const handleDeleteRequest = (client: Client) => {
        if (!hasPermission('clients.delete')) {
            notifyError({ message: 'No tienes permiso para eliminar empresarias' });
            return;
        }
        setDeleteError(null);

        // Check referential integrity: does any order reference this client?
        const orderClientIds = orders.map((o) => o.clientId);
        if (!canDeleteClient(client.id, orderClientIds)) {
            setDeleteError(
                `No se puede eliminar a "${client.firstName}" porque tiene pedidos asociados. Primero debe eliminar o reasignar sus pedidos.`
            );
            setDeleteTarget(null);
            return;
        }

        setDeleteTarget(client);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteClientMutation.mutateAsync(deleteTarget.id);
            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'DELETE_CLIENT',
                    module: 'clients',
                    detail: `Eliminó empresaria: ${deleteTarget.firstName} (ID: ${deleteTarget.identificationNumber})`
                });
            }
            notifySuccess(`Empresaria "${deleteTarget.firstName}" eliminada correctamente`);
            setDeleteTarget(null);
        } catch (error) {
            notifyError(error, "Ocurrió un error al eliminar. Intente de nuevo.");
        }
    };

    if (isError) {
        return (
            <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                    <h2 className="text-base font-medium text-muted-foreground tracking-tight">
                        Listado de Empresarias
                    </h2>
                </div>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h2 className="text-base font-medium text-muted-foreground tracking-tight">
                    Listado de Empresarias
                </h2>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Empresaria
                </Button>
            </div>

            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="client-search"
                    placeholder="Buscar por cédula o nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

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
                onDelete={handleDeleteRequest}
            />

            <ClientForm
                client={selectedClient}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
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
                    if (!open) setDeleteTarget(null);
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
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} className="w-full sm:w-auto">
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
