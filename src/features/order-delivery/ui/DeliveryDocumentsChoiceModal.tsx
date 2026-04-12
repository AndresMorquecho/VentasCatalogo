import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { FileText, Truck } from 'lucide-react';

export interface PreparedPdf {
    document: React.ReactElement;
    fileName: string;
    title: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    delivery: PreparedPdf;
    distribution: PreparedPdf | null;
    /** Solo cierra el selector y abre la vista previa; no debe borrar los PDF preparados en el padre. */
    onPickDelivery: () => void;
    onPickDistribution: () => void;
}

export function DeliveryDocumentsChoiceModal({
    open,
    onOpenChange,
    delivery,
    distribution,
    onPickDelivery,
    onPickDistribution,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-900">Documentos de la entrega</DialogTitle>
                    <p className="text-sm text-slate-500 font-normal pt-1">
                        Elige qué comprobante previsualizar, descargar o imprimir.
                    </p>
                </DialogHeader>

                <div className="grid gap-3 py-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto py-4 px-4 justify-start gap-3 border-monchito-purple/25 hover:bg-monchito-purple/5"
                        onClick={() => onPickDelivery()}
                    >
                        <div className="rounded-lg bg-monchito-purple/15 p-2 shrink-0">
                            <Truck className="h-5 w-5 text-monchito-purple" />
                        </div>
                        <div className="text-left min-w-0">
                            <div className="font-semibold text-slate-900">Comprobante de entrega</div>
                            <div className="text-xs text-slate-500 truncate">{delivery.fileName}</div>
                        </div>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto py-4 px-4 justify-start gap-3 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                        disabled={!distribution}
                        onClick={() => {
                            if (!distribution) return;
                            onPickDistribution();
                        }}
                    >
                        <div className="rounded-lg bg-amber-100 p-2 shrink-0">
                            <FileText className="h-5 w-5 text-amber-800" />
                        </div>
                        <div className="text-left min-w-0">
                            <div className="font-semibold text-slate-900">Distribución de saldo a favor</div>
                            <div className="text-xs text-slate-500">
                                {distribution ? (
                                    <span className="truncate block">{distribution.fileName}</span>
                                ) : (
                                    'No hubo distribución en este lote'
                                )}
                            </div>
                        </div>
                    </Button>
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
