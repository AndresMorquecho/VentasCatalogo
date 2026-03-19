import { createElement } from 'react';
import { OrderReceiptDocument } from '../ui/OrderReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import { clientApi } from '@/shared/api/clientApi';
import { bankAccountApi } from '@/shared/api/bankAccountApi';

/**
 * Prepara el documento PDF de recibo de pedido para preview
 * Esta función NO descarga automáticamente, sino que retorna el elemento React
 * para ser usado con el PDFPreviewModal
 */
export async function prepareOrderReceiptForPreview(order: Order, user?: User, childOrders: Order[] = []) {
    try {
        // Fetch full client details for the receipt
        const client = await clientApi.getById(order.clientId);

        // Fetch bank info if applicable
        let bank = null;
        if (order.bankAccountId) {
            try {
                bank = await bankAccountApi.getById(order.bankAccountId);
            } catch (e) {
                console.warn('Could not fetch bank info for PDF receipt');
            }
        }

        // Create the React element
        const element = createElement(OrderReceiptDocument, { order, user, client, childOrders, bank } as any);
        
        return {
            document: element,
            fileName: `recibo-pedido-${order.receiptNumber || 'sin-numero'}.pdf`,
            title: `Recibo de Pedido - ${order.receiptNumber || 'Sin número'}`
        };
    } catch (error) {
        console.error('Error preparando recibo PDF:', error);
        throw error;
    }
}
