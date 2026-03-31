import { Skeleton } from "@/shared/ui/skeleton";
import {
    TableBody,
    TableCell,
    TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Pencil, Trash2, Filter, Phone, Eye, RefreshCw } from "lucide-react";
import type { Client } from "@/entities/client/model/types";
import { cn } from "@/shared/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/shared/ui/badge";

// 90 days = 3 months threshold for data update reminder
const DATA_UPDATE_THRESHOLD_DAYS = 90;

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
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-8 space-y-3">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <div className="text-slate-300 mb-3">
                    <Filter className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-sm font-medium text-slate-400">No hay empresarias registradas</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-monchito-purple/10 shadow-[0_20px_50px_rgba(107,33,168,0.05)] overflow-hidden">
            <div className="w-full overflow-x-auto custom-scrollbar rounded-t-2xl">
                <table className="text-left border-collapse min-w-[1200px] w-full">
                    <thead>
                        <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10">
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest h-12 text-left">
                                Documento
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left">
                                Nombre
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left">
                                Ciudad
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left">
                                Estado
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left">
                                Contacto
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left">
                                F. Registro
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left">
                                Últ. Pedido
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left">
                                Actualización
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <TableBody>
                        {clients.map((client) => {
                            const lastOrder = client.lastOrderDate ? new Date(client.lastOrderDate) : null;
                            // NEW: never ordered | ACTIVE: ordered in last 30 days | INACTIVE: ordered > 30 days ago
                            const isNew = !lastOrder;
                            const isActive = !isNew && differenceInDays(new Date(), lastOrder!) <= 30;
                            const isInactive = !isNew && !isActive;

                            // Check if client data needs update (> 90 days since last update)
                            const lastUpdate = client.lastDataUpdate ? new Date(client.lastDataUpdate) : null;
                            const daysSinceUpdate = lastUpdate ? differenceInDays(new Date(), lastUpdate) : DATA_UPDATE_THRESHOLD_DAYS + 1;
                            const needsDataUpdate = daysSinceUpdate > DATA_UPDATE_THRESHOLD_DAYS;

                            return (
                                <TableRow
                                    key={client.id}
                                    className={cn(
                                        "border-b border-monchito-purple/5 hover:bg-monchito-purple/5 transition-all duration-200",
                                        needsDataUpdate && "bg-amber-50/40 hover:bg-amber-50/60",
                                        !needsDataUpdate && isInactive && "bg-red-50/30 hover:bg-red-50/50",
                                        !needsDataUpdate && isNew && "bg-blue-50/20 hover:bg-blue-50/40"
                                    )}
                                >
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-mono text-xs font-bold text-slate-700">{client.identificationNumber}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{client.identificationType.replace('_', ' ')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-bold text-slate-800">{client.firstName}</span>
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {client.province}, {client.city}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-600">{client.city}</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        {client.isBlocked ? (
                                            <Badge variant="destructive" className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                                                Bloqueada
                                            </Badge>
                                        ) : isNew ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                                                Nueva
                                            </Badge>
                                        ) : isInactive ? (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                                                Inactiva
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                                                Activa
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-medium text-slate-700">{client.phone1}</span>
                                                {client.isWhatsApp && (
                                                    <div className="bg-green-50 p-1 rounded-md">
                                                        <Phone className="h-3 w-3 text-green-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                                {client.operator1}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-600">
                                            {format(new Date(client.createdAt), "dd/MM/yyyy")}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        {client.lastOrderDate ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-medium text-slate-700">
                                                    {format(new Date(client.lastOrderDate), "dd/MM/yyyy")}
                                                </span>
                                                {client.lastBrandName && (
                                                    <span className="text-[9px] font-black text-monchito-purple uppercase tracking-wider">
                                                        {client.lastBrandName}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs font-medium text-slate-400 italic">Ninguno</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        {needsDataUpdate ? (
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1 w-fit">
                                                    <RefreshCw className="h-2.5 w-2.5" />
                                                    Desactualizada
                                                </Badge>
                                                {lastUpdate && (
                                                    <span className="text-[9px] text-slate-400">
                                                        Hace {daysSinceUpdate}d
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-0.5">
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg w-fit">
                                                    Al día
                                                </Badge>
                                                {lastUpdate && (
                                                    <span className="text-[9px] text-slate-400">
                                                        {format(lastUpdate, "dd/MM/yyyy")}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex justify-end gap-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onView(client)}
                                                title="Ver Detalle"
                                                className="h-8 w-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(client)}
                                                title="Editar"
                                                className="h-8 w-8 rounded-lg text-monchito-purple hover:text-monchito-purple hover:bg-monchito-purple/10 transition-all"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(client)}
                                                title="Eliminar"
                                                className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </table>
            </div>
        </div>
    );
}
