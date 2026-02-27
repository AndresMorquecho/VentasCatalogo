import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { CashClosureDetailedPDF } from '../ui/CashClosureDetailedPDF';
import type { CashClosureDetailedReport } from '@/entities/cash-closure/model/detailed-types';

/**
 * Generates and downloads a detailed cash closure PDF report
 * 
 * @param report - The detailed cash closure report data
 * @param fileName - Optional custom filename (defaults to "Cierre_Caja_YYYY-MM-DD.pdf")
 */
export async function generateCashClosurePDF(
    report: CashClosureDetailedReport,
    fileName?: string
): Promise<void> {
    try {
        // Generate PDF blob
        const blob = await pdf(createElement(CashClosureDetailedPDF, { report }) as any).toBlob();

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || `Cierre_Caja_${report.fromDate}_${report.toDate}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating cash closure PDF:', error);
        throw new Error('No se pudo generar el PDF del cierre de caja');
    }
}
