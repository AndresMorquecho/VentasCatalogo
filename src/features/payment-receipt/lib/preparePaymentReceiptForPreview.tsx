import { createElement } from 'react';
import { PaymentReceiptDocument } from '../ui/PaymentReceiptDocument';
import type { Order } from '@/entities/order/model/types';

/**
 * Prepara el documento PDF de estado de cuenta para preview
 * Esta función NO descarga automáticamente, sino que retorna el elemento React
 * para ser usado con el PDFPreviewModal
 */
export async function preparePaymentReceiptForPreview(order: Order, payments: any[], userName: string) {
    try {
        const element = createElement(PaymentReceiptDocument, { order, payments, userName } as any);
        
        return {
            document: element,
            fileName: `estado-cuenta-${order.receiptNumber}.pdf`,
            title: `Estado de Cuenta - ${order.receiptNumber}`
        };
    } catch (error) {
        console.error('Error preparando estado de cuenta PDF:', error);
        throw error;
    }
}
