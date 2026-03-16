import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Gift } from "lucide-react";
import type { ClientCreditSummary } from "../model/types";

interface Props {
    credits: ClientCreditSummary[];
}

export function ClientCreditsTable({ credits }: Props) {
    if (credits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Gift className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No hay saldos a favor registrados</p>
                <p className="text-sm">Los créditos aparecerán cuando se generen ajustes en recepciones</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead className="text-right">Créditos Generados</TableHead>
                        <TableHead className="text-right">Créditos Usados</TableHead>
                        <TableHead className="text-right font-bold">Saldo Disponible</TableHead>
                        <TableHead>Última Actualización</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {credits.map((credit, index) => (
                        <TableRow key={credit.clientId} className="hover:bg-emerald-50/30">
                            <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                            <TableCell className="font-medium">{credit.clientName}</TableCell>
                            <TableCell className="text-slate-600">{credit.clientIdentification || '-'}</TableCell>
                            <TableCell className="text-slate-600">{credit.clientPhone || '-'}</TableCell>
                            <TableCell className="text-right text-slate-600">
                                ${credit.totalGenerated.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-slate-600">
                                ${credit.totalUsed.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                                    ${credit.totalCredit.toFixed(2)}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                                {new Date(credit.lastUpdated).toLocaleDateString('es-EC')}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
