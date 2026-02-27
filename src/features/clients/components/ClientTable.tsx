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
        <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Cédula</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Nombre</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Ciudad</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Teléfono</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Email</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Registrada</TableHead>
                        <TableHead className="text-right whitespace-nowrap text-xs sm:text-sm">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow key={client.id}>
                            <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                                {client.identificationNumber}
                            </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm">
                                {client.firstName}
                                <span className="block text-[10px] sm:text-xs text-muted-foreground font-normal">
                                    {client.province}, {client.city}
                                </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap">{client.city}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                                <span className="block whitespace-nowrap">{client.phone1}</span>
                                <span className="block text-[10px] sm:text-xs text-muted-foreground">
                                    {client.operator1}
                                </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">{client.email}</TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                {new Date(client.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-0.5 sm:gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(client)}
                                        title="Editar"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                    >
                                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(client)}
                                        title="Eliminar"
                                        className="text-destructive hover:text-destructive h-7 w-7 sm:h-8 sm:w-8"
                                    >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        </div>
    );
}
