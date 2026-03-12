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
import { Pencil, Trash2, Filter, Phone, Eye } from "lucide-react";
import type { Client } from "@/entities/client/model/types";
import { cn } from "@/shared/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/shared/ui/badge";

interface ClientTableProps {
    clients: Client[];
    isLoading: boolean;
    onEdit: (client: Client) => void;
    onView: (client: Client) => void;
    onDelete: (client: Client) => void;
}

export function ClientTable({ clients, isLoading, onEdit, onView, onDelete }: ClientTableProps) {
    // Export logic moved to ClientList for fetching all data correctly


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
        <div className="space-y-4">
            <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                                    <div className="flex items-center gap-1">
                                        Documento <Filter className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                                    <div className="flex items-center gap-1">
                                        Nombre <Filter className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">Ciudad</TableHead>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">Estado</TableHead>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">Contacto</TableHead>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">F. Registro</TableHead>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">Últ. Pedido</TableHead>
                                <TableHead className="text-right whitespace-nowrap text-xs sm:text-sm">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => {
                                const lastOrder = client.lastOrderDate ? new Date(client.lastOrderDate) : null;
                                // Active if ordered in the last 30 days
                                const isInactive = !lastOrder || differenceInDays(new Date(), lastOrder) > 30;

                                return (
                                    <TableRow
                                        key={client.id}
                                        className={cn(
                                            "hover:bg-slate-50/80 transition-colors cursor-pointer",
                                            isInactive && "bg-red-50/50 hover:bg-red-100/50 dark:bg-red-950/20 dark:hover:bg-red-900/30"
                                        )}
                                    >
                                        <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                                            <span className="block">{client.identificationNumber}</span>
                                            <span className="text-[10px] opacity-70 uppercase">{client.identificationType.replace('_', ' ')}</span>
                                        </TableCell>
                                        <TableCell className="font-medium text-xs sm:text-sm">
                                            {client.firstName}
                                            <span className="block text-[10px] sm:text-xs text-muted-foreground font-normal">
                                                {client.province}, {client.city}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{client.city}</TableCell>
                                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                            {isInactive ? (
                                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                                                    Inactivo
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                                                    Activo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm">
                                            <div className="flex items-center gap-1">
                                                <span className="whitespace-nowrap">{client.phone1}</span>
                                                {client.isWhatsApp && <Phone className="h-3 w-3 text-green-600" />}
                                            </div>
                                            <span className="block text-[10px] sm:text-xs text-muted-foreground">
                                                {client.operator1}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                            {format(new Date(client.createdAt), "dd/MM/yyyy")}
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                            {client.lastOrderDate
                                                ? <div className="flex flex-col">
                                                    <span>{format(new Date(client.lastOrderDate), "dd/MM/yyyy")}</span>
                                                    {client.lastBrandName && (
                                                        <span className="text-[10px] font-bold text-primary uppercase leading-tight">
                                                            {client.lastBrandName}
                                                        </span>
                                                    )}
                                                </div>
                                                : <span className="text-muted-foreground italic">Ninguno</span>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-0.5 sm:gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onView(client)}
                                                    title="Ver Detalle"
                                                    className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                </Button>
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
