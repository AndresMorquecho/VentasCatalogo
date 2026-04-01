import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { DeliveryReceiptDocument } from '../ui/DeliveryReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import type { Client } from '@/entities/client/model/types';
import { systemSettingsApi } from '@/features/system-settings/api/systemSettingsApi';

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
        // Fetch settings
        let settings = { location: "Quito - Ecuador", phone: "2787237", support_phone: "", note: "" };
        try {
            const settingsData = await systemSettingsApi.getSettings();
            settingsData.forEach(s => {
                if (s.key === 'location') settings.location = s.value;
                if (s.key === 'phone') settings.phone = s.value;
                if (s.key === 'support_phone') settings.support_phone = s.value;
            });
        } catch (e) {
            console.warn('Could not fetch settings for PDF delivery receipt');
        }

        const element = createElement(DeliveryReceiptDocument, { 
            order, 
            orders, 
            client, 
            paymentInfo, 
            deliveryId,
            settings
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
