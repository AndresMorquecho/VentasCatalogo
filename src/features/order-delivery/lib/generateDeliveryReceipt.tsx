import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { DeliveryReceiptDocument } from '../ui/DeliveryReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import type { Client } from '@/entities/client/model/types';


interface DeliveryPaymentInfo {
    amountPaidNow: number;
    method: string;
    user: string;
    currentCreditAmount?: number;
    hasCurrentCredit?: boolean;
}

export async function generateDeliveryReceipt(
    order: Order | undefined, 
    orders: Order[] | undefined, 
    client: Client | undefined, 
    paymentInfo: DeliveryPaymentInfo, 
    deliveryId: string
) {
    try {


        const element = createElement(DeliveryReceiptDocument, { 
            order, 
            orders, 
            client, 
            paymentInfo, 
            deliveryId
        });

        // Generar blob del PDF
        const blob = await pdf(element as any).toBlob();
        
        // Descargar automáticamente
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `entrega-${deliveryId || order?.receiptNumber || 'sin-numero'}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Limpieza
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        return true;
    } catch (error) {
        console.error('Error generando recibo de entrega PDF:', error);
        return false;
    }
}
