import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { FileDown, Loader2, Trash2, Calendar, Users } from "lucide-react"
import { generateCashClosurePDF } from "../lib/generateCashClosurePDF"
import { useToast } from "@/shared/ui/use-toast"
import { useDeleteCashClosure, useUserCashClosures, useDeleteUserCashClosure } from "../api/hooks"
import { useAuth } from "@/shared/auth"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog"
import type { CashClosure } from "@/entities/cash-closure/model/types"

interface CashClosureHistoryProps {
    closures: CashClosure[]
    onDeleteSuccess?: () => void
}

export function CashClosureHistory({ closures, onDeleteSuccess }: CashClosureHistoryProps) {
    const [historySubTab, setHistorySubTab] = useState<'global' | 'user'>('global');
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { showToast } = useToast();
    const deleteClosure = useDeleteCashClosure();
    const deleteUserClosure = useDeleteUserCashClosure();
    const { data: allUserClosures, refetch: refetchAllUserClosures } = useUserCashClosures();
    const { hasPermission, user } = useAuth();

    const canDelete = hasPermission('cash_closure.delete');

    const handleDownloadPDF = async (closure: CashClosure) => {
        if (!closure.detailedReport) {
            showToast("Este cierre no tiene reporte detallado disponible", "error");
            return;
        }

        // Check if detailed report has the required structures for PDF (legacy closures check)
        if (!closure.detailedReport.incomeBySource || !closure.detailedReport.incomeByMethod) {
            showToast("Este cierre de caja antiguo no cuenta con la estructura detallada requerida para generar el PDF", "warning");
            return;
        }

        setDownloadingId(closure.id);
        try {
            await generateCashClosurePDF({
                ...closure.detailedReport,
                boxUserName: closure.detailedReport.boxUserName || closure.detailedReport.closedByName || 'Usuario',
                generatedBy: user?.username || 'Usuario',
                expectedAmount: closure.expectedAmount,
                actualAmount: closure.actualAmount,
                difference: closure.difference,
                notes: closure.notes,
            });
            showToast("PDF descargado exitosamente", "success");
        } catch (error) {
            console.error("Error downloading PDF", error);
            showToast("Error al descargar el PDF", "error");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDeleteClick = (closureId: string) => {
        setDeletingId(closureId);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;

        try {
            await deleteClosure.mutateAsync(deletingId);
            showToast("Cierre de caja eliminado exitosamente", "success");
            setShowDeleteDialog(false);
            setDeletingId(null);
            if (onDeleteSuccess) onDeleteSuccess();
        } catch (error) {
            console.error("Error deleting closure", error);
            showToast("Error al eliminar el cierre de caja", "error");
        }
    };

    const handleDeleteUserClosureClick = async (closureId: string) => {
        try {
            await deleteUserClosure.mutateAsync(closureId);
            showToast("Cierre de usuario eliminado exitosamente", "success");
            refetchAllUserClosures();
            if (onDeleteSuccess) onDeleteSuccess();
        } catch (error) {
            console.error("Error deleting user closure", error);
            showToast("Error al eliminar el cierre de usuario", "error");
        }
    };

    return (
        <>
            <div className="flex gap-2 p-4 pb-0">
                <Button
                    variant={historySubTab === 'global' ? 'default' : 'outline'}
                    onClick={() => setHistorySubTab('global')}
                    className="flex-1 text-xs font-bold gap-1.5 h-9"
                >
                    <Calendar className="h-4 w-4" /> Cierres Globales
                </Button>
                <Button
                    variant={historySubTab === 'user' ? 'default' : 'outline'}
                    onClick={() => setHistorySubTab('user')}
                    className="flex-1 text-xs font-bold gap-1.5 h-9"
                >
                    <Users className="h-4 w-4" /> Cierres de Usuarios
                </Button>
            </div>

            <div className="rounded-md border mt-4 mx-4 mb-4">
                <h3 className="text-lg font-semibold tracking-tight p-4">
                    {historySubTab === 'global' ? 'Historial de Cierres Globales' : 'Historial de Cierres de Usuarios'}
                </h3>
                {historySubTab === 'global' ? (
                    closures && closures.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Cierre</TableHead>
                                    <TableHead>Periodo</TableHead>
                                    <TableHead className="text-right">Efec. Sistema</TableHead>
                                    <TableHead className="text-right">Efec. Físico</TableHead>
                                    <TableHead className="text-right">Estado (Cuadre)</TableHead>
                                    <TableHead>Justificación</TableHead>
                                    <TableHead>Resp.</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {closures.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {new Date(c.closedAt).toLocaleDateString('es-EC', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(c.closedAt).toLocaleTimeString('es-EC')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <div className="flex flex-col">
                                                <span>Desde: {new Date(c.fromDate).toLocaleDateString()}</span>
                                                <span>Hasta: {new Date(c.toDate).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            ${c.expectedAmount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-sm">
                                            ${c.actualAmount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-black ${c.difference < -0.01 ? 'text-red-600' : c.difference > 0.01 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {c.difference < -0.01 ? 'FALTANTE' : c.difference > 0.01 ? 'SOBRANTE' : 'CUADRÓ'}
                                                </span>
                                                <span className={`text-xs ${c.difference < -0.01 ? 'text-red-600' : c.difference > 0.01 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    ${Math.abs(c.difference).toFixed(2)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={c.notes || 'Ninguna'}>
                                            {c.notes || '-'}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {c.closedBy}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                {hasPermission('cash_closure.export_excel') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownloadPDF(c)}
                                                        disabled={!c.detailedReport || downloadingId === c.id}
                                                        className="h-8"
                                                        title="Descargar PDF"
                                                    >
                                                        {downloadingId === c.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <FileDown className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeleteClick(c.id)}
                                                        disabled={deleteClosure.isPending}
                                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title="Eliminar cierre (solo administradores)"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">No hay cierres registrados.</div>
                    )
                ) : (
                    allUserClosures && allUserClosures.length > 0 ? (
                        <div className="space-y-6 p-4">
                            {Object.entries(
                                allUserClosures.reduce((acc: any, closure: any) => {
                                    const dateKey = new Date(closure.closedAt).toLocaleDateString('es-EC', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    });
                                    if (!acc[dateKey]) acc[dateKey] = [];
                                    acc[dateKey].push(closure);
                                    return acc;
                                }, {})
                            ).map(([dateLabel, closuresForDay]: [string, any]) => (
                                <div key={dateLabel} className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-3">
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" /> {dateLabel}
                                    </h4>
                                    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                                        <Table>
                                            <TableHeader className="bg-slate-50/50">
                                                <TableRow>
                                                    <TableHead className="text-[10px] font-black uppercase">Hora</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase">Usuario/Cajero</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase">Periodo</TableHead>
                                                    <TableHead className="text-right text-[10px] font-black uppercase">Esperado</TableHead>
                                                    <TableHead className="text-right text-[10px] font-black uppercase">Recibido</TableHead>
                                                    <TableHead className="text-right text-[10px] font-black uppercase">Diferencia</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase">Notas</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase">Recibido por</TableHead>
                                                    <TableHead className="text-right text-[10px] font-black uppercase">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {closuresForDay.map((u: any) => (
                                                    <TableRow key={u.id} className="hover:bg-slate-50/40">
                                                        <TableCell className="text-xs font-medium whitespace-nowrap">
                                                            {new Date(u.closedAt).toLocaleTimeString('es-EC')}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-bold text-slate-800">
                                                            {u.username.toUpperCase()}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            <div className="flex flex-col text-[11px] text-slate-500">
                                                                <span>Desde: {new Date(u.fromDate).toLocaleDateString()}</span>
                                                                <span>Hasta: {new Date(u.toDate).toLocaleDateString()}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-sm">
                                                            ${Number(u.expectedAmount).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-sm text-emerald-700">
                                                            ${Number(u.actualAmount).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            <span className={Number(u.difference) < -0.01 ? 'text-rose-600' : Number(u.difference) > 0.01 ? 'text-blue-600' : 'text-emerald-600'}>
                                                                ${Number(u.difference).toFixed(2)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={u.notes}>
                                                            {u.notes || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-medium">
                                                            {u.receivedBy}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                {canDelete && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleDeleteUserClosureClick(u.id)}
                                                                        className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                                        title="Eliminar este cierre de usuario"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">No hay cierres de usuarios registrados.</div>
                    )
                )}
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar cierre de caja?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. El cierre de caja será eliminado permanentemente.
                            Podrás crear un nuevo cierre para este período si es necesario.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteClosure.isPending}
                        >
                            {deleteClosure.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
