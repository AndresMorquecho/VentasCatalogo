import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../api/walletApi";
import { Clock, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/shared/ui/badge";

const METHOD_LABELS: Record<string, string> = {
    TRANSFERENCIA: "Transferencia",
    DEPOSITO: "Depósito",
    CHEQUE: "Cheque",
    EFECTIVO: "Efectivo",
};

export function PendingRechargesBanner() {
    const { data, isLoading } = useQuery<any>({
        queryKey: ["wallet-recharges-pending"],
        queryFn: () => walletApi.getRecharges({ status: "PENDIENTE_VALIDACION", limit: 50 }),
        refetchInterval: 30000,
    });

    const pending = data?.data || [];

    if (isLoading || pending.length === 0) return null;

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-100 border-b border-amber-200">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400/30">
                    <Clock className="h-4 w-4 text-amber-700" />
                </div>
                <div className="flex-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-800">
                        Recargas Pendientes de Validación
                    </span>
                </div>
                <Badge className="bg-amber-400 text-amber-900 border-0 font-black text-xs px-2.5">
                    {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
                </Badge>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] font-black text-amber-700 uppercase tracking-wider border-b border-amber-200">
                            <th className="px-4 py-2 text-left">Fecha</th>
                            <th className="px-4 py-2 text-left">Cliente</th>
                            <th className="px-4 py-2 text-left">Método / Ref</th>
                            <th className="px-4 py-2 text-right">Monto</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                        {pending.map((r: any) => (
                            <tr key={r.id} className="hover:bg-amber-100/50 transition-colors">
                                <td className="px-4 py-2.5">
                                    <div className="font-bold text-slate-700 text-xs">
                                        {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: es })}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {format(new Date(r.createdAt), "HH:mm")}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="font-black text-slate-800 text-xs uppercase">
                                        {r.client?.firstName}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        {r.client?.identificationNumber}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-amber-300 text-amber-700 bg-white">
                                            {METHOD_LABELS[r.paymentMethod] || r.paymentMethod}
                                        </Badge>
                                        <span className="font-mono text-xs font-bold text-slate-600">
                                            {r.reference || "—"}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {r.bankAccount?.bankName || "—"}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <span className="font-black text-amber-700 text-sm">
                                        +${Number(r.amount).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex justify-center">
                                        <div className="flex items-center gap-1 bg-amber-200 text-amber-800 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">
                                            <AlertCircle className="h-3 w-3" />
                                            Esperando validación
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-amber-100/60 border-t border-amber-200">
                <p className="text-[10px] text-amber-700 font-medium">
                    <Info className="h-3 w-3 inline mr-1 text-amber-600" /> Estas recargas aún no están disponibles en la billetera del cliente. Valídalas en <strong>Validaciones de Billetera</strong>.
                </p>
            </div>
        </div>
    );
}
