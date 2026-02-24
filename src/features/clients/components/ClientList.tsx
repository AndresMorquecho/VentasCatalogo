import { useState, useMemo } from "react";
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

/**
 * Filters clients in memory by search query.
 * Matches against identificationNumber and firstName.
 * Case insensitive, partial match.
 * Does not modify the API or React Query cache.
 */
function filterClients(clients: Client[], query: string): Client[] {
    if (!query.trim()) return clients;
    const lower = query.toLowerCase().trim();
    return clients.filter(
        (c) =>
            c.identificationNumber.toLowerCase().includes(lower) ||
            c.firstName.toLowerCase().includes(lower)
    );
}

export function ClientList() {
    const { data: clients = [], isLoading, isError, refetch } = useClientList();
    const { data: orders = [] } = useOrderList();
    const deleteClientMutation = useDeleteClient();

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // In-memory filtering — no API call, no cache mutation
    const filteredClients = useMemo(
        () => filterClients(clients, searchQuery),
        [clients, searchQuery]
    );

    const handleCreate = () => {
        setSelectedClient(null);
        setIsFormOpen(true);
    };

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setIsFormOpen(true);
    };

    const handleDeleteRequest = (client: Client) => {
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
            setDeleteTarget(null);
        } catch (error) {
            console.error("Error deleting client", error);
            setDeleteError("Ocurrió un error al eliminar. Intente de nuevo.");
        }
    };

    if (isError) {
        return (
            <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
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
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
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
                clients={filteredClients}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
            />

            <ClientForm
                client={selectedClient}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
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
