import { Badge } from "@/shared/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { ArrowDown, ArrowUp, Undo2, CalendarClock, PackageCheck } from "lucide-react";
import type { InventoryMovementType } from "@/entities/inventory-movement/model/types";

export interface GroupedInventoryMovement {
    orderId: string;
    clientName: string;
    brandName: string;
    orderCode: string;
    entryDate: string | null;
    deliveryDate: string | null;
    returnDate: string | null;
    status: InventoryMovementType;
    daysInWarehouse: number;
}

interface Props {
    movements: GroupedInventoryMovement[];
}

const renderStatusBadge = (status: InventoryMovementType) => {
    switch (status) {
        case 'ENTRY':
            return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 w-full justify-center">En Bodega</Badge>;
        case 'DELIVERED':
            return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 w-full justify-center">Entregado</Badge>;
        case 'RETURNED':
            return <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200 w-full justify-center">Devuelto</Badge>;
        default:
            return <Badge variant="outline" className="w-full justify-center">Desconocido</Badge>;
    }
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-slate-300">-</span>;
    return <span className="text-slate-700">{new Date(dateString).toLocaleDateString('es-EC')}</span>;
};

export function InventoryTable({ movements }: Props) {
    if (movements.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-400">
                <p>No se encontraron registros de inventario.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[80px]">Flujo</TableHead>
                            <TableHead>Ingresó (Bodega)</TableHead>
                            <TableHead>Salió (Entrega)</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Marca / Pedido</TableHead>
                            <TableHead className="text-center">Tiempos</TableHead>
                            <TableHead className="text-center w-[120px]">Estado Actual</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.map((move) => (
                            <TableRow key={move.orderId} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="py-3 pl-4">
                                    <div className="flex -space-x-2">
                                        {/* Entry Icon always present if it entered */}
                                        {move.entryDate && (
                                            <div className="bg-emerald-100 p-1.5 rounded-full border-2 border-white relative z-10" title="Ingresó a Bodega">
                                                <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                                            </div>
                                        )}
                                        {/* Exit Icon based on status */}
                                        {move.deliveryDate && (
                                            <div className="bg-blue-100 p-1.5 rounded-full border-2 border-white relative z-20" title="Se entregó">
                                                <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                                            </div>
                                        )}
                                        {move.returnDate && (
                                            <div className="bg-orange-100 p-1.5 rounded-full border-2 border-white relative z-20" title="Se Devolvió">
                                                <Undo2 className="h-3.5 w-3.5 text-orange-600" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <PackageCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        {formatDate(move.entryDate)}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarClock className={`h-3.5 w-3.5 ${(move.deliveryDate || move.returnDate) ? 'text-blue-500' : 'text-slate-300'}`} />
                                        {formatDate(move.deliveryDate || move.returnDate)}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium text-sm text-slate-800">
                                    {move.clientName}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">{move.brandName}</span>
                                        <span className="text-[10px] bg-slate-100 px-1 rounded w-fit mt-0.5 text-slate-500">#{move.orderCode}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`font-bold px-2 py-1 rounded text-xs whitespace-nowrap inline-block ${move.daysInWarehouse > 10 && move.status === 'ENTRY'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        {move.daysInWarehouse} días
                                    </span>
                                </TableCell>
                                <TableCell className="text-center pr-4">
                                    {renderStatusBadge(move.status)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
