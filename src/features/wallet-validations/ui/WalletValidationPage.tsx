import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "../../wallet/api/walletApi";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/button";
import { CheckCircle, XCircle, Search, Clock, ArrowLeft, Loader2, CheckSquare, Square, Info } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { useDebounce } from "@/shared/lib/hooks";
import { Badge } from "@/shared/ui/badge";
import { useNotifications } from "@/shared/lib/notifications";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pagination } from "@/shared/ui/pagination";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

export function WalletValidationPage() {
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebounce(searchText, 1000);
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    
    const queryClient = useQueryClient();
    const { notifySuccess, notifyError } = useNotifications();

    const { data: response, isLoading, error } = useQuery<any>({
        queryKey: ["wallet-recharges", "pending", debouncedSearch, page],
        queryFn: () => walletApi.getRecharges({
            status: "PENDIENTE_VALIDACION",
            search: debouncedSearch,
            page,
            limit
        })
    });

    const validateMutation = useMutation({
        mutationFn: (ids: string[]) => walletApi.validateRecharges(ids),
        onSuccess: () => {
            notifySuccess("Pagos validados correctamente.");
            setSelectedIds([]);
            setConfirmDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["wallet-recharges"] });
            queryClient.invalidateQueries({ queryKey: ["client-credits"] });
        },
        onError: (error) => notifyError(error, "Error al validar pagos.")
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => walletApi.rejectRecharge(id, reason),
        onSuccess: () => {
            notifySuccess("Pago rechazado.");
            queryClient.invalidateQueries({ queryKey: ["wallet-recharges"] });
        },
        onError: (error) => notifyError(error, "Error al rechazar pago.")
    });

    const recharges = response?.data || [];
    const pagination = response?.pagination;

    if (error) {
        console.error('[WalletValidationPage] Error loading recharges:', error);
    }

    // Filter selected recharges for summary
    const selectedRecharges = recharges.filter((r: any) => selectedIds.includes(r.id));
    const totalSelectedAmount = selectedRecharges.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    const handleSelectAll = () => {
        if (selectedIds.length === recharges.length && recharges.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(recharges.map((r: any) => r.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBatchValidateClick = () => {
        if (selectedIds.length === 0) return;
        setConfirmDialogOpen(true);
    };

    const handleConfirmValidation = () => {
        validateMutation.mutate(selectedIds);
    };

    const handleReject = (id: string) => {
        const reason = window.prompt("Motivo del rechazo:");
        if (reason) {
            rejectMutation.mutate({ id, reason });
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Validación de Pagos" 
                description="Validar transferencias y depósitos pendientes de la Billetera Virtual"
                icon={CheckCircle}
                actions={
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => window.history.back()}
                        className="h-10 w-10 text-slate-400"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                }
            />

            <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-wrap gap-4 items-end justify-between">
                <div className="flex-1 min-w-[300px] flex items-end gap-3">
                    <div className="flex-1 max-w-md">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Filtrar por Cliente o Referencia</label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Nombre, ID o N° de transacción..."
                                className="pl-11 h-11 border-slate-200 bg-slate-50/50 font-medium"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        disabled={selectedIds.length === 0 || validateMutation.isPending}
                        onClick={handleBatchValidateClick}
                        className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black uppercase text-[10px] tracking-widest h-11 px-8 shadow-lg shadow-monchito-purple/20"
                    >
                        {validateMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Validar Seleccionados ({selectedIds.length})
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                <th className="px-6 py-4 text-left w-12">
                                    <button onClick={handleSelectAll} className="hover:text-primary transition-colors">
                                        {recharges.length > 0 && selectedIds.length === recharges.length ? (
                                            <CheckSquare className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Square className="h-5 w-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left">Empresaria / Cliente</th>
                                <th className="px-6 py-4 text-left">Fecha Solicitud</th>
                                <th className="px-6 py-4 text-left">Método</th>
                                <th className="px-6 py-4 text-left">Referencia</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={7} className="px-6 py-8 animate-pulse bg-slate-50/30"></td></tr>
                                ))
                            ) : recharges.length > 0 ? (
                                recharges.map((r: any) => (
                                    <tr key={r.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(r.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggleSelect(r.id)} className="hover:text-primary transition-colors">
                                                {selectedIds.includes(r.id) ? (
                                                    <CheckSquare className="h-5 w-5 text-primary" />
                                                ) : (
                                                    <Square className="h-5 w-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-700 uppercase text-xs">{r.client?.firstName}</div>
                                            <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{r.client?.identificationNumber}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-slate-600">
                                                {format(new Date(r.createdAt), "dd MMM yyyy", { locale: es })}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                <Clock className="h-3 w-3" /> {format(new Date(r.createdAt), "HH:mm")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="text-[9px] font-black tracking-widest bg-white border-slate-200 text-slate-600 uppercase">
                                                {r.paymentMethod}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-black text-primary font-mono">{r.reference || '—'}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[150px]">
                                                {r.bankAccount?.bankName} ({r.bankAccount?.name})
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-base font-black text-slate-800">${Number(r.amount).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedIds([r.id]);
                                                        setConfirmDialogOpen(true);
                                                    }}
                                                    title="Validar"
                                                    className="h-8 w-8 text-monchito-purple hover:bg-monchito-purple/5"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleReject(r.id)}
                                                    title="Rechazar"
                                                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <CheckCircle className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No hay pagos pendientes de validación</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination && pagination.pages > 1 && (
                <div className="flex justify-end pt-2">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.pages}
                        onPageChange={setPage}
                        totalItems={pagination.total}
                        itemsPerPage={limit}
                    />
                </div>
            )}

            <ConfirmDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                onConfirm={handleConfirmValidation}
                title="Confirmar Validación de Pagos"
                confirmText={`Validar Pagos`}
            >
                <div className="space-y-4">
                    <div className="bg-monchito-purple/5 border border-monchito-purple/10 p-4 rounded-2xl flex items-start gap-3">
                        <div className="bg-monchito-purple/10 p-2 rounded-xl text-monchito-purple">
                            <Info className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-monchito-purple font-black text-sm uppercase tracking-tight">Resumen de Validación</p>
                            <p className="text-monchito-purple/70 text-xs font-medium">Se acreditará el saldo a los clientes y se registrarán los movimientos financieros.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Transacciones</p>
                            <p className="text-2xl font-black text-slate-700">{selectedIds.length}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Monto Total</p>
                            <p className="text-2xl font-black text-primary">${totalSelectedAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Clientes Involucrados</p>
                        {selectedRecharges.map((r: any) => (
                            <div key={r.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-xs font-bold text-slate-600 uppercase">{r.client?.firstName}</span>
                                <span className="text-xs font-black text-slate-800">${Number(r.amount).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </ConfirmDialog>
        </div>
    );
}

// Added default export to help lazy loading
export default WalletValidationPage;
