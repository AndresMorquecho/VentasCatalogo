import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { OrderReceiptDocument } from '../ui/OrderReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';

import { clientApi } from '@/shared/api/clientApi';

export async function generateOrderReceipt(order: Order, user?: User) {
    try {
        // Fetch full client details for the receipt
        const client = await clientApi.getById(order.clientId);

        // Create the React element
        // @ts-ignore - We are dynamically adding the client prop which we will add to the component next
        const element = createElement(OrderReceiptDocument, { order, user, client });
        
        // Generate PDF blob
        const blob = await pdf(element as any).toBlob();
        
        // Trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo-pedido-${order.receiptNumber || 'sin-numero'}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        return true;
    } catch (error) {
        console.error('Error generando recibo PDF:', error);
        return false;
    }
}
