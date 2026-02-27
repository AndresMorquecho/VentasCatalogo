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
import { FileDown, Loader2, Trash2 } from "lucide-react"
import { generateCashClosurePDF } from "../lib/generateCashClosurePDF"
import { useToast } from "@/shared/ui/use-toast"
import { useDeleteCashClosure } from "../api/hooks"
import { authService } from "@/shared/services/authService"
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
}

export function CashClosureHistory({ closures }: CashClosureHistoryProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { showToast } = useToast();
    const deleteClosure = useDeleteCashClosure();

    // Check if user is admin via real authService
    const currentUser = authService.getUser();
    const userIsAdmin = currentUser?.role === 'ADMIN';

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
            await generateCashClosurePDF(closure.detailedReport);
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
        } catch (error) {
            console.error("Error deleting closure", error);
            showToast("Error al eliminar el cierre de caja", "error");
        }
    };

    if (!closures || closures.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No hay cierres registrados.</div>
    }

    return (
        <>
            <div className="rounded-md border mt-8">
                <h3 className="text-lg font-semibold tracking-tight p-4">Historial de Cierres</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha Cierre</TableHead>
                            <TableHead>Periodo</TableHead>
                            <TableHead className="text-right">Esperado</TableHead>
                            <TableHead className="text-right">Real (Contado)</TableHead>
                            <TableHead className="text-right">Diferencia</TableHead>
                            <TableHead className="text-right text-muted-foreground">Movs.</TableHead>
                            <TableHead>Cerrado Por</TableHead>
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
                                <TableCell className={`text-right font-black ${c.difference < 0 ? 'text-red-600' : c.difference > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    ${c.difference.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">
                                    {c.movementCount}
                                </TableCell>
                                <TableCell className="text-xs font-medium">
                                    {c.closedBy}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
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
                                        {userIsAdmin && (
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
