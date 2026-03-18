import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import { PDFViewer } from '@react-pdf/renderer';
import { useState, useEffect } from "react";

interface PDFPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    pdfDocument: React.ReactElement;
    fileName: string;
    onDownload?: () => void;
    onPrint?: () => void;
}

export function PDFPreviewModal({
    open,
    onOpenChange,
    title,
    pdfDocument,
    fileName,
    onDownload,
    onPrint
}: PDFPreviewModalProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Reset loading state when modal opens
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            // Simulate loading time for PDF rendering
            const timer = setTimeout(() => setIsLoading(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [open, pdfDocument]);

    const handleDownload = () => {
        if (onDownload) {
            onDownload();
        }
    };

    const handlePrint = () => {
        if (onPrint) {
            onPrint();
        } else {
            // Default print behavior - open in new window and print
            window.print();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-start justify-between gap-4 pr-14">
                        {/* Left: Title and info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-monchito-purple/10 p-2 rounded-lg shrink-0">
                                <svg className="h-5 w-5 text-monchito-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-lg font-bold text-slate-900 truncate">
                                    {title}
                                </DialogTitle>
                                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                                    {fileName}
                                </p>
                            </div>
                        </div>

                        {/* Right: Action buttons - con espacio suficiente para el botón X */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="gap-2 h-9 px-3 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline text-sm">Imprimir</span>
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleDownload}
                                className="gap-2 h-9 px-3 rounded-xl bg-monchito-purple hover:bg-monchito-purple/90 text-white"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline text-sm">Descargar</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 relative bg-slate-100 overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 text-monchito-purple animate-spin" />
                                <p className="text-sm font-medium text-slate-600">Cargando vista previa...</p>
                            </div>
                        </div>
                    )}
                    <PDFViewer
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                        }}
                        showToolbar={false}
                    >
                        {pdfDocument as any}
                    </PDFViewer>
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
                    <p className="text-xs text-slate-500 text-center">
                        Usa los botones superiores para descargar o imprimir el documento
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
