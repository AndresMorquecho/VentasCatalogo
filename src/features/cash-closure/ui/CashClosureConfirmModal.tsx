import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AsyncButton } from "@/shared/ui/async-button";
import { CheckCircle2, AlertCircle, Wallet, Banknote, FileText, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

interface CashClosureConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    previewData: any;
    actualAmount: number;
    expectedAmount: number;
    difference: number;
    onConfirm: (notes: string) => Promise<void>;
    isLoading: boolean;
}

export function CashClosureConfirmModal({
    open,
    onOpenChange,
    previewData,
    actualAmount,
    expectedAmount,
    difference,
    onConfirm,
    isLoading
}: CashClosureConfirmModalProps) {
    const [notes, setNotes] = useState<string>("");
    const isDifferenceSignificant = Math.abs(difference) > 0.01;

    const handleConfirm = async () => {
        await onConfirm(notes);
        setNotes(""); // Reset notes after confirmation
    };

    const formatDate = (isoDate: string | null) => {
        if (!isoDate) return "N/A";
        const d = new Date(isoDate);
        if (d.getFullYear() <= 1970) return "Inicio de Registros";
        return d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col rounded-2xl border-none shadow-2xl">
                <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <div className="w-8 h-8 bg-monchito-purple rounded-lg flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900">Confirmar Cierre de Caja</p>
                            <p className="text-xs text-slate-500 font-normal">Revisa los detalles antes de confirmar. Esta acción no se puede deshacer.</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 py-2">
                    {/* Periodo y Resumen de Movimientos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Periodo */}
                        <div className="bg-monchito-purple/5 border border-monchito-purple/10 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                                <Calendar className="h-3 w-3 text-monchito-purple" />
                                <h3 className="text-monchito-purple text-xs font-black uppercase tracking-widest">
                                    Periodo del Cierre
                                </h3>
                            </div>
                            <div className="space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Desde:</span>
                                    <span className="font-medium">{formatDate(previewData?.fromDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Hasta:</span>
                                    <span className="font-medium">{formatDate(previewData?.toDate)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-0.5 mt-1">
                                    <span className="text-slate-500">Movimientos:</span>
                                    <span className="font-bold text-monchito-purple">{previewData?.movementCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Resumen de Movimientos */}
                        <div className="bg-monchito-purple/5 border border-monchito-purple/10 rounded-lg p-2">
                            <h3 className="text-monchito-purple text-xs font-black uppercase tracking-widest mb-1">
                                Resumen de Movimientos
                            </h3>
                            <div className="space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        <span className="text-slate-500">Ingresos:</span>
                                    </div>
                                    <span className="font-bold text-green-600">
                                        ${previewData?.totalIncome?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                        <span className="text-slate-500">Egresos:</span>
                                    </div>
                                    <span className="font-bold text-red-600">
                                        ${previewData?.totalExpense?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-0.5 mt-1">
                                    <span className="text-slate-500">Neto:</span>
                                    <span className="font-bold text-monchito-purple">
                                        ${((previewData?.totalIncome || 0) - (previewData?.totalExpense || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparación de Montos */}
                    <div className="bg-white border-2 border-slate-200 rounded-lg p-2">
                        <h3 className="text-slate-700 text-xs font-black uppercase tracking-widest mb-2">
                            Comparación de Montos
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Wallet className="h-3 w-3 text-blue-500" />
                                    <p className="text-xs font-bold uppercase text-slate-500">Esperado</p>
                                </div>
                                <p className="text-lg sm:text-xl font-black text-slate-900">${expectedAmount.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Banknote className="h-3 w-3 text-monchito-purple" />
                                    <p className="text-xs font-bold uppercase text-slate-500">Contado</p>
                                </div>
                                <p className="text-lg sm:text-xl font-black text-monchito-purple">${actualAmount.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <AlertCircle className={`h-3 w-3 ${isDifferenceSignificant ? 'text-orange-500' : 'text-green-500'}`} />
                                    <p className="text-xs font-bold uppercase text-slate-500">Diferencia</p>
                                </div>
                                <p className={`text-lg sm:text-xl font-black ${isDifferenceSignificant ? 'text-orange-600' : 'text-green-600'}`}>
                                    ${difference.toFixed(2)}
                                </p>
                                {isDifferenceSignificant ? (
                                    <Badge className="bg-orange-500 text-white font-bold text-[9px] border-none px-1 py-0 mt-1">DESCUADRE</Badge>
                                ) : (
                                    <Badge className="bg-green-500 text-white font-bold text-[9px] border-none px-1 py-0 mt-1">CUADRADO</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Alerta de Descuadre */}
                    {isDifferenceSignificant && (
                        <Alert className="bg-orange-50 border-orange-200">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertTitle className="font-black text-orange-800 text-xs">Descuadre Detectado</AlertTitle>
                            <AlertDescription className="text-xs text-orange-700">
                                Existe una diferencia de ${Math.abs(difference).toFixed(2)}. Por favor, justifica esta diferencia en las notas.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Campo de Notas */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-slate-600" />
                            <label htmlFor="notes" className="text-xs font-bold text-slate-700">
                                Notas y Justificación {isDifferenceSignificant && <span className="text-red-500">*</span>}
                            </label>
                        </div>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={isDifferenceSignificant ? "Explica la razón del descuadre..." : "Observaciones adicionales (opcional)"}
                            className="h-9 rounded-xl text-xs"
                        />
                        {isDifferenceSignificant && !notes.trim() && (
                            <p className="text-xs text-orange-600 font-medium">
                                Es obligatorio justificar el descuadre antes de confirmar
                            </p>
                        )}
                    </div>

                    {/* Advertencia Final */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">⚠️ Importante</p>
                        <p className="text-xs text-slate-600">
                            Una vez confirmado, el cierre no podrá ser modificado. Solo un administrador puede eliminarlo en caso de error grave.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="h-8 px-4 rounded-xl border-slate-200 text-xs"
                    >
                        Cancelar
                    </Button>
                    <AsyncButton
                        onClick={handleConfirm}
                        disabled={isDifferenceSignificant && !notes.trim()}
                        isLoading={isLoading}
                        loadingText="Procesando..."
                        className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-semibold h-8 px-4 rounded-xl text-xs"
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Confirmar Cierre
                    </AsyncButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
