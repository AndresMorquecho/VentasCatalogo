import { createElement } from 'react';
import { CashClosureDetailedPDF } from '../ui/CashClosureDetailedPDF';
import type { CashClosureDetailedReport } from '@/entities/cash-closure/model/detailed-types';

/**
 * Prepara el documento PDF de cierre de caja para preview
 * Esta función NO descarga automáticamente, sino que retorna el elemento React
 * para ser usado con el PDFPreviewModal
 */
export async function prepareCashClosurePDFForPreview(
    report: CashClosureDetailedReport,
    customFileName?: string
) {
    try {
        const element = createElement(CashClosureDetailedPDF, { report } as any);
        
        const fileName = customFileName || `Cierre_Caja_${report.fromDate}_${report.toDate}.pdf`;
        
        return {
            document: element,
            fileName,
            title: `Cierre de Caja - ${report.fromDate} al ${report.toDate}`
        };
    } catch (error) {
        console.error('Error preparando cierre de caja PDF:', error);
        throw new Error('No se pudo preparar el PDF del cierre de caja');
    }
}
