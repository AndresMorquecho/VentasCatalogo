import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { PaymentReceiptDocument } from '../ui/PaymentReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import { clientApi } from '@/shared/api/clientApi';


export async function generatePaymentReceipt(order: Order, payments: any[], userName: string) {
    try {
        const client = await clientApi.getById(order.clientId);



        const element = createElement(PaymentReceiptDocument, { order, payments, userName, client });
        
        // Generate PDF blob
        const blob = await pdf(element as any).toBlob();
        
        // Trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `estado-cuenta-${order.receiptNumber || 'sin-numero'}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        return true;
    } catch (error) {
        console.error('Error generando estado de cuenta PDF:', error);
        return false;
    }
}
