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

/**
 * Prepara el documento PDF de recibo de entrega para preview
 * Esta función NO descarga automáticamente, sino que retorna el elemento React
 * para ser usado con el PDFPreviewModal
 */
export async function prepareDeliveryReceiptForPreview(
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
            console.warn('Could not fetch settings for PDF delivery preview');
        }

        // Crear el elemento React del documento
        const element = createElement(DeliveryReceiptDocument, { 
            order, 
            orders, 
            client, 
            paymentInfo, 
            deliveryId,
            settings
        });
        
        return {
            document: element,
            fileName: `entrega-${deliveryId || order?.receiptNumber || 'sin-numero'}.pdf`,
            title: `Comprobante de Entrega - ${deliveryId || '---'}`
        };
    } catch (error) {
        console.error('Error preparando comprobante de entrega PDF:', error);
        throw error;
    }
}
