import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "../api/walletApi";
import { XCircle, AlertTriangle, EyeOff, Loader2, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

const METHOD_LABELS: Record<string, string> = {
    TRANSFERENCIA: "Transferencia",
    DEPOSITO: "Depósito",
    CHEQUE: "Cheque",
    EFECTIVO: "Efectivo",
};

export function RejectedRechargesBanner() {
    const queryClient = useQueryClient();
    
    const { data, isLoading } = useQuery<any>({
        queryKey: ["wallet-recharges-rejected"],
        queryFn: () => walletApi.getRecharges({ 
            status: "RECHAZADO", 
            isDismissed: "false",
            limit: 5 
        }),
        refetchInterval: 30000,
    });

    const dismissMutation = useMutation({
        mutationFn: (id: string) => walletApi.dismissRecharge(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallet-recharges-rejected"] });
        }
    });

    const rejected = data?.data || [];

    if (isLoading || rejected.length === 0) return null;

    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-red-100 border-b border-red-200">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-400/30">
                    <XCircle className="h-4 w-4 text-red-700" />
                </div>
                <div className="flex-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-red-800">
                        Recargas Recientemente Rechazadas
                    </span>
                </div>
                <Badge className="bg-red-500 text-white border-0 font-black text-xs px-2.5">
                    {rejected.length} rechazo{rejected.length !== 1 ? "s" : ""}
                </Badge>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[750px] whitespace-nowrap">
                    <thead>
                        <tr className="text-[10px] font-black text-red-700 uppercase tracking-wider border-b border-red-200">
                            <th className="px-4 py-2 text-left">Fecha</th>
                            <th className="px-4 py-2 text-left">Cliente</th>
                            <th className="px-4 py-2 text-left">Referencia</th>
                            <th className="px-4 py-2 text-left">Registrado Por</th>
                            <th className="px-4 py-2 text-left">Motivo del Rechazo</th>
                            <th className="px-4 py-2 text-right">Monto</th>
                            <th className="px-4 py-2 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                        {rejected.map((r: any) => (
                            <tr key={r.id} className="hover:bg-red-100/50 transition-colors">
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
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-red-300 text-red-700 bg-white">
                                            {METHOD_LABELS[r.paymentMethod] || r.paymentMethod}
                                        </Badge>
                                        <span className="font-mono text-xs font-bold text-slate-600">
                                            {r.reference || "—"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="font-bold text-slate-700 text-[11px] uppercase truncate max-w-[100px]">
                                        {r.createdByName || "—"}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2 text-red-700 bg-red-100/50 px-3 py-1.5 rounded-xl border border-red-200/50">
                                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="text-xs font-bold italic tracking-tight">
                                            {r.rejectionReason || "Sin motivo especificado"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <span className="font-black text-red-700 text-sm">
                                        ${Number(r.amount).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-200/20"
                                        onClick={() => dismissMutation.mutate(r.id)}
                                        disabled={dismissMutation.isPending}
                                        title="Ocultar notificación"
                                    >
                                        {dismissMutation.isPending && dismissMutation.variables === r.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <EyeOff className="h-4 w-4" />
                                        )}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-red-100/60 border-t border-red-200">
                <p className="text-[10px] text-red-700 font-medium leading-relaxed">
                    <Info className="h-3 w-3 inline mr-1 text-red-600" /> Estas recargas no fueron procesadas. Pulsa en <EyeOff className="inline h-3 w-3" /> para ocultar esta fila. 
                    <span className="block mt-0.5 opacity-80">Las recargas ocultas permanecen visibles en la pestaña <strong>Historial de Recargas</strong> de arriba.</span>
                </p>
            </div>
        </div>
    );
}
