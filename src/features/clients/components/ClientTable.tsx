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
import { Pencil, Trash2, Download, Filter, Phone } from "lucide-react";
import type { Client } from "@/entities/client/model/types";
import { cn } from "@/shared/lib/utils";
import { format, differenceInDays } from "date-fns";
import * as XLSX from "xlsx";

interface ClientTableProps {
    clients: Client[];
    isLoading: boolean;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
}

export function ClientTable({ clients, isLoading, onEdit, onDelete }: ClientTableProps) {
    const exportToExcel = () => {
        const dataToExport = clients.map(client => ({
            "Cédula/Documento": client.identificationNumber,
            "Tipo": client.identificationType,
            "Nombre Completo": client.firstName,
            "País": client.country,
            "Provincia": client.province,
            "Ciudad": client.city,
            "Email": client.email,
            "Teléfono 1": client.phone1,
            "Operador 1": client.operator1,
            "WhatsApp": client.isWhatsApp ? "SI" : "NO",
            "Fecha Registro": format(new Date(client.createdAt), "yyyy-MM-dd"),
            "Último Pedido": client.lastOrderDate ? format(new Date(client.lastOrderDate), "yyyy-MM-dd") : "N/A",
            "Estado Pago": client.paymentPreference
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Empresarias");
        XLSX.writeFile(workbook, `empresarias_${format(new Date(), "yyyyMMdd")}.xlsx`);
    };

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
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Excel
                </Button>
            </div>

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
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">Contacto</TableHead>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">F. Registro</TableHead>
                                <TableHead className="whitespace-nowrap text-xs sm:text-sm">Últ. Pedido</TableHead>
                                <TableHead className="text-right whitespace-nowrap text-xs sm:text-sm">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => {
                                const lastOrder = client.lastOrderDate ? new Date(client.lastOrderDate) : null;
                                const isInactive = !lastOrder || differenceInDays(new Date(), lastOrder) > 90;

                                return (
                                    <TableRow
                                        key={client.id}
                                        className={cn(isInactive && "bg-red-50/50 hover:bg-red-100/50 dark:bg-red-950/20 dark:hover:bg-red-900/30")}
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
                                                ? format(new Date(client.lastOrderDate), "dd/MM/yyyy")
                                                : <span className="text-muted-foreground italic">Ninguno</span>
                                            }
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
