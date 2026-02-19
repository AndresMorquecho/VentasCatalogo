import { Skeleton } from "@/shared/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Client } from "@/entities/client/model/types";

interface ClientTableProps {
    clients: Client[];
    isLoading: boolean;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
}

export function ClientTable({ clients, isLoading, onEdit, onDelete }: ClientTableProps) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No hay empresarias registradas.
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Ciudad</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registrada</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow key={client.id}>
                            <TableCell className="font-mono text-sm">
                                {client.identificationNumber}
                            </TableCell>
                            <TableCell className="font-medium">
                                {client.firstName}
                                <span className="block text-xs text-muted-foreground font-normal">
                                    {client.province}, {client.city}
                                </span>
                            </TableCell>
                            <TableCell>{client.city}</TableCell>
                            <TableCell>
                                <span className="block">{client.phone1}</span>
                                <span className="block text-xs text-muted-foreground">
                                    {client.operator1}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm">{client.email}</TableCell>
                            <TableCell>
                                {new Date(client.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(client)}
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(client)}
                                        title="Eliminar"
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
