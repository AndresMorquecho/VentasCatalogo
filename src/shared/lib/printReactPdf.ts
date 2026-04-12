import type { ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';

/**
 * Dispara el diálogo de impresión del PDF (contenido del documento), no la SPA.
 * Prioriza un iframe oculto para no abrir pestaña nueva; si falla, usa ventana emergente.
 */
export async function printReactPdfDocument(pdfDoc: ReactElement): Promise<void> {
    const blob = await pdf(pdfDoc as any).toBlob();
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'print-pdf');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
        position: 'fixed',
        right: '0',
        bottom: '0',
        width: '0',
        height: '0',
        border: 'none',
        opacity: '0',
        pointerEvents: 'none',
    });
    iframe.src = url;
    document.body.appendChild(iframe);

    let printed = false;

    const tryIframePrint = () => {
        if (printed) return;
        const cw = iframe.contentWindow;
        if (!cw) return;
        try {
            cw.focus();
            cw.print();
            printed = true;
        } catch {
            /* noop */
        }
    };

    iframe.onload = () => setTimeout(tryIframePrint, 300);

    setTimeout(tryIframePrint, 900);

    setTimeout(() => {
        if (!printed) {
            const printWin = window.open(url, '_blank', 'noopener,noreferrer');
            if (printWin) {
                const tryWinPrint = () => {
                    try {
                        printWin.focus();
                        printWin.print();
                        printed = true;
                    } catch {
                        /* noop */
                    }
                };
                printWin.onload = () => setTimeout(tryWinPrint, 300);
                setTimeout(tryWinPrint, 600);
            }
        }
    }, 1400);

    setTimeout(() => {
        try {
            iframe.remove();
        } catch {
            /* noop */
        }
    }, 120_000);

    setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
