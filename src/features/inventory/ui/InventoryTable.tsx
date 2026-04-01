import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { PackageCheck, UserCircle } from "lucide-react";
import type { InventoryMovementType } from "@/entities/inventory-movement/model/types";

export interface GroupedInventoryMovement {
    orderId: string;
    // BASIC INFO
    receiptNumber: string;
    orderNumber: string;
    emissionDate: string;
    createdByName: string;
    brandName: string;
    orderType: string;
    
    // CLIENT INFO
    clientName: string;
    clientIdentification: string;
    clientPhone: string;
    
    // FINANCIALS
    orderTotal: number;
    invoiceTotal: number;
    abono: number;
    saldo: number;
    invoiceNumber: string;
    
    // DATES & STORAGE
    entryDate: string;
    possibleDeliveryDate: string | null;
    deliveryDate: string | null;
    returnDate: string | null;
    daysInWarehouse: number;
    status: InventoryMovementType;
    processedBy: string;
    deliveryReceipt: string;
}

interface Props {
    movements: GroupedInventoryMovement[];
    startIndex?: number;
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-slate-300">-</span>;
    return <span className="text-slate-700 font-bold">{new Date(dateString).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>;
};

const formatCurrency = (val: number) => {
    return <span className="font-bold text-slate-800">${val.toFixed(2)}</span>;
};

export function InventoryTable({ movements, startIndex = 0 }: Props) {
    if (movements.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-slate-50 text-slate-400 m-4">
                <PackageCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">No se encontraron registros de inventario.</p>
                <p className="text-xs">Pruebe ajustando los filtros de búsqueda.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
                <Table className="min-w-[1800px]">
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-200 hover:bg-transparent">
                            <TableHead className="w-[60px] text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4 pl-4 text-center">N°</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">No. de Recibo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4 border-l border-slate-100">Emisión</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Ingresado Por</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-monchito-purple py-4">N° de Pedido</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Tipo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Catálogo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Empresaria</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Valor Pedido</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Posible Entrega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">No. Factura</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Valor de Factura</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-emerald-600 py-4">Abono</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-orange-600 py-4">Saldo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4 border-l border-slate-100 pl-4">Fecha de Ingreso</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Recibido</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Fecha de Entrega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Entregado</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4 pr-4">Recibo de Entrega</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.map((move, index) => (
                            <TableRow key={move.orderId} className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                                <TableCell className="py-4 pl-4 text-center font-black text-[11px] text-slate-400 bg-slate-50/30 group-hover:bg-transparent transition-colors">
                                    {startIndex + index + 1}
                                </TableCell>
                                
                                <TableCell className="font-black text-slate-900 text-xs whitespace-nowrap">{move.receiptNumber}</TableCell>
                                <TableCell className="text-[11px] whitespace-nowrap border-l border-slate-50">{formatDate(move.emissionDate)}</TableCell>
                                <TableCell className="text-[11px] text-slate-500 font-medium whitespace-nowrap italic">{move.createdByName}</TableCell>
                                <TableCell className="font-black text-monchito-purple text-xs whitespace-nowrap bg-monchito-purple/5 group-hover:bg-monchito-purple/10 transition-colors">{move.orderNumber}</TableCell>
                                <TableCell className="text-[10px] font-black text-slate-400 uppercase">{move.orderType}</TableCell>
                                <TableCell className="text-[11px] font-black text-emerald-700 whitespace-nowrap uppercase tracking-tighter">{move.brandName}</TableCell>
                                <TableCell className="text-[11px] font-black text-slate-800 whitespace-nowrap uppercase leading-tight min-w-[150px]">
                                    <div className="flex items-center gap-1.5">
                                        <UserCircle className="h-3 w-3 text-slate-300" />
                                        {move.clientName}
                                    </div>
                                </TableCell>

                                <TableCell className="text-[11px]">{formatCurrency(move.orderTotal)}</TableCell>
                                <TableCell className="text-[11px] whitespace-nowrap text-slate-400 font-medium italic underline decoration-slate-200">
                                    {formatDate(move.possibleDeliveryDate)}
                                </TableCell>
                                <TableCell className="text-[10px] font-black text-slate-800 bg-emerald-50/20 px-2">{move.invoiceNumber}</TableCell>
                                <TableCell className="text-[11px]">{formatCurrency(move.invoiceTotal)}</TableCell>
                                <TableCell className="text-[11px] text-emerald-700 font-black">{formatCurrency(move.abono)}</TableCell>
                                <TableCell className="text-[11px] text-orange-700 font-black">{formatCurrency(move.saldo)}</TableCell>
                                
                                <TableCell className="text-[11px] whitespace-nowrap border-l border-slate-50 pl-4">{formatDate(move.entryDate)}</TableCell>
                                <TableCell className="text-[10px] font-black text-slate-400">{(move.status === 'ENTRY' || move.status === 'DELIVERED') ? 'SI' : 'NO'}</TableCell>
                                <TableCell className="text-[11px] whitespace-nowrap">{formatDate(move.deliveryDate)}</TableCell>
                                <TableCell className="text-center font-black text-[10px] text-slate-400">{move.status === 'DELIVERED' ? 'SI' : 'NO'}</TableCell>
                                <TableCell className="text-[11px] font-bold text-slate-400 pr-4">{move.deliveryReceipt}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
