import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { ArrowDown, ArrowUp, Undo2, PackageCheck, UserCircle, Phone } from "lucide-react";
import type { InventoryMovementType } from "@/entities/inventory-movement/model/types";

export interface GroupedInventoryMovement {
    orderId: string;
    // BASIC INFO
    receiptNumber: string;
    orderNumber: string;
    emissionDate: string;
    createdByName: string;
    brandName: string;
    
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
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-slate-300">-</span>;
    return <span className="text-slate-700 font-bold">{new Date(dateString).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>;
};

const formatCurrency = (val: number) => {
    return <span className="font-bold text-slate-800">${val.toFixed(2)}</span>;
};

export function InventoryTable({ movements }: Props) {
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
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-200 hover:bg-transparent">
                            <TableHead className="w-[40px] text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4 pl-4 text-center">F</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">No. Recibo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Emisión</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Ingresado por</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">No. Pedido</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Tipo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Catálogo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Identificación</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Empresaria</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Teléfonos</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Valor P.</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Posible E.</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">No. Fact</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Valor Fact.</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 text-emerald-600 py-4">Abono</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 text-orange-600 py-4">Saldo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Bodega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Días</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Entrega</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">E.</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4">Procesó</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tighter text-slate-400 py-4 pr-4">R. Entrega</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.map((move) => (
                            <TableRow key={move.orderId} className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                                <TableCell className="py-4 pl-4 text-center">
                                    <div className="flex justify-center -space-x-1.5">
                                        {move.status === 'ENTRY' ? (
                                            <div className="bg-emerald-100 p-1 rounded-full border border-white" title="En Bodega">
                                                <ArrowDown className="h-2.5 w-2.5 text-emerald-600" />
                                            </div>
                                        ) : move.status === 'DELIVERED' ? (
                                            <div className="bg-blue-100 p-1 rounded-full border border-white" title="Entregado">
                                                <ArrowUp className="h-2.5 w-2.5 text-blue-600" />
                                            </div>
                                        ) : (
                                            <div className="bg-orange-100 p-1 rounded-full border border-white" title="Devuelto">
                                                <Undo2 className="h-2.5 w-2.5 text-orange-600" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                
                                <TableCell className="font-black text-slate-900 text-xs whitespace-nowrap">{move.receiptNumber}</TableCell>
                                <TableCell className="text-[11px] whitespace-nowrap">{formatDate(move.emissionDate)}</TableCell>
                                <TableCell className="text-[11px] text-slate-500 font-medium whitespace-nowrap italic">{move.createdByName}</TableCell>
                                <TableCell className="font-bold text-slate-700 text-xs whitespace-nowrap bg-slate-50/30">#{move.orderNumber}</TableCell>
                                <TableCell className="text-[10px] font-black text-slate-400">PEDIDO</TableCell>
                                <TableCell className="text-[11px] font-black text-emerald-700 whitespace-nowrap uppercase tracking-tighter">{move.brandName}</TableCell>
                                <TableCell className="text-[11px] font-mono text-slate-400">{move.clientIdentification}</TableCell>
                                <TableCell className="text-[11px] font-black text-slate-800 whitespace-nowrap uppercase leading-tight min-w-[150px]">
                                    <div className="flex items-center gap-1.5">
                                        <UserCircle className="h-3 w-3 text-slate-300" />
                                        {move.clientName}
                                    </div>
                                </TableCell>
                                <TableCell className="text-[10px] text-slate-400 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                        <Phone className="h-2.5 w-2.5 opacity-50" />
                                        {move.clientPhone}
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
                                
                                <TableCell className="text-[10px] font-black text-slate-400">SI</TableCell>
                                <TableCell className="text-center">
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${move.daysInWarehouse > 10 && move.status === 'ENTRY' ? 'bg-red-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                                        {move.daysInWarehouse}
                                    </span>
                                </TableCell>
                                <TableCell className="text-[11px] whitespace-nowrap">{formatDate(move.deliveryDate)}</TableCell>
                                <TableCell className="text-center">{move.status === 'DELIVERED' ? 'SI' : 'NO'}</TableCell>
                                <TableCell className="text-[10px] font-black text-slate-400 uppercase">{move.processedBy}</TableCell>
                                <TableCell className="text-[11px] font-bold text-slate-400 pr-4">{move.deliveryReceipt}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
