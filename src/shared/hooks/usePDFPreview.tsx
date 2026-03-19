import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';

interface UsePDFPreviewOptions {
    fileName: string;
    onDownloadComplete?: () => void;
    onError?: (error: Error) => void;
}

export function usePDFPreview(options?: UsePDFPreviewOptions) {
    const { fileName = 'document.pdf', onDownloadComplete, onError } = options || {};
    const [isOpen, setIsOpen] = useState(false);
    const [pdfDocument, setPdfDocument] = useState<React.ReactElement | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const openPreview = useCallback((document: React.ReactElement) => {
        setPdfDocument(document);
        setIsOpen(true);
    }, []);

    const closePreview = useCallback(() => {
        setIsOpen(false);
        setPdfDocument(null);
    }, []);

    const downloadPDF = useCallback(async () => {
        if (!pdfDocument) return;

        setIsGenerating(true);
        try {
            const blob = await pdf(pdfDocument as any).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            if (onDownloadComplete) {
                onDownloadComplete();
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            if (onError) {
                onError(error as Error);
            }
        } finally {
            setIsGenerating(false);
        }
    }, [pdfDocument, fileName, onDownloadComplete, onError]);

    const printPDF = useCallback(async () => {
        if (!pdfDocument) return;

        try {
            const blob = await pdf(pdfDocument as any).toBlob();
            const url = URL.createObjectURL(blob);
            
            // Open in new window for printing
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Error printing PDF:', error);
            if (onError) {
                onError(error as Error);
            }
        }
    }, [pdfDocument, onError]);

    return {
        isOpen,
        pdfDocument,
        isGenerating,
        openPreview,
        closePreview,
        downloadPDF,
        printPDF
    };
}
