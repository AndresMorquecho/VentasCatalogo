import { createElement } from 'react';
import { DeliveryReceiptDocument } from '../ui/DeliveryReceiptDocument';
import { clientApi } from '@/shared/api/clientApi';
import type { Order } from '@/entities/order/model/types';

/**
 * Prepara el documento PDF de entrega para preview
 * Esta función NO descarga automáticamente, sino que retorna el elemento React
 * para ser usado con el PDFPreviewModal
 */
export const prepareDeliveryReceiptForPreview = async (order: Order, paymentInfo?: any) => {
    try {
        console.log("Preparando comprobante de entrega para preview...", order);

        // Fetch client details using getById for performance
        const client = await clientApi.getById(order.clientId);

        const element = createElement(DeliveryReceiptDocument, { order, client, paymentInfo } as any);

        return {
            document: element,
            fileName: `Entrega-${order.receiptNumber}-${new Date().getTime()}.pdf`,
            title: `Comprobante de Entrega - ${order.receiptNumber}`
        };
    } catch (error) {
        console.error("Error preparing delivery PDF:", error);
        throw error;
    }
};
