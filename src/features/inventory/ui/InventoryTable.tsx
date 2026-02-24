import { Badge } from "@/shared/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { ArrowDown, ArrowUp, Undo2, AlertCircle } from "lucide-react";
import type { InventoryMovement, InventoryMovementType } from "@/entities/inventory-movement/model/types";

interface ExtendedMovement extends InventoryMovement {
    clientName: string;
    brandName: string;
    orderCode: string;
    daysInWarehouse: number;
}

interface Props {
    movements: ExtendedMovement[];
}

const renderTypeIcon = (type: InventoryMovementType) => {
    switch (type) {
        case 'ENTRY':
            return <div className="bg-emerald-100 p-1 rounded-full"><ArrowDown className="h-4 w-4 text-emerald-600" /></div>;
        case 'DELIVERED':
            return <div className="bg-blue-100 p-1 rounded-full"><ArrowUp className="h-4 w-4 text-blue-600" /></div>;
        case 'RETURNED':
            return <div className="bg-orange-100 p-1 rounded-full"><Undo2 className="h-4 w-4 text-orange-600" /></div>;
        default:
            return <AlertCircle className="h-4 w-4 text-slate-400" />;
    }
};

const renderStatusBadge = (status: InventoryMovementType) => {
    switch (status) {
        case 'ENTRY':
            return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">En Bodega</Badge>;
        case 'DELIVERED':
            return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Entregado</Badge>;
        case 'RETURNED':
            return <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">Devuelto</Badge>;
        default:
            return <Badge variant="outline">Desconocido</Badge>;
    }
};

export function InventoryTable({ movements }: Props) {
    if (movements.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-400">
                <p>No se encontraron movimientos de inventario.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[50px] text-xs sm:text-sm whitespace-nowrap">Mov.</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Fecha Ingreso</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Cliente</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Marca / Pedido</TableHead>
                        <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">Días en Bodega</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((move) => (
                        <TableRow key={move.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                            <TableCell className="py-2 sm:py-3 pl-2 sm:pl-4">
                                {renderTypeIcon(move.type)}
                            </TableCell>
                            <TableCell className="font-mono text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                                {new Date(move.date).toLocaleDateString('es-EC')}
                            </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm text-slate-800">
                                {move.clientName}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-700">{move.brandName}</span>
                                    <span className="text-[9px] sm:text-[10px] bg-slate-100 px-1 rounded w-fit mt-0.5 text-slate-500">#{move.orderCode}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <span className={`font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs whitespace-nowrap ${move.daysInWarehouse > 10 && move.type === 'ENTRY'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {move.daysInWarehouse} días
                                </span>
                            </TableCell>
                            <TableCell className="text-right pr-2 sm:pr-4">
                                {renderStatusBadge(move.type)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        </div>
    );
}
