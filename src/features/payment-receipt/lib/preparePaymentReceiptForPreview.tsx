import { createElement } from 'react';
import { PaymentReceiptDocument } from '../ui/PaymentReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import { clientApi } from '@/shared/api/clientApi';


/**
 * Prepara el estado de cuenta PDF para preview
 */
export async function preparePaymentReceiptForPreview(order: Order, payments: any[], userName: string) {
    try {
        const client = await clientApi.getById(order.clientId);



        const element = createElement(PaymentReceiptDocument, { order, payments, userName, client });
        
        return {
            document: element,
            fileName: `estado-cuenta-${order.receiptNumber || 'sin-numero'}.pdf`,
            title: `Estado de Cuenta - ${order.receiptNumber || 'Sin número'}`
        };
    } catch (error) {
        console.error('Error preparando recibo PDF:', error);
        throw error;
    }
}
