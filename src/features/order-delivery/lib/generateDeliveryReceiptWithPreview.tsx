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
 * Prepara el documento PDF de recibo de entrega para preview (Pedido Individual)
 */
export async function prepareDeliveryReceiptForPreview(
    order: Order | undefined, 
    paymentInfo: DeliveryPaymentInfo, 
    deliveryId?: string,
    client?: Client,
    orders?: Order[]
) {
    try {
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

        const element = createElement(DeliveryReceiptDocument, { 
            order, 
            orders: orders || (order ? [order] : []), 
            client, 
            paymentInfo, 
            deliveryId: deliveryId || order?.receiptNumber || 'sin-id',
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

/**
 * Prepara el documento PDF de recibo de entrega para preview (Lote de Pedidos)
 */
export async function prepareBatchDeliveryReceiptForPreview(
    orders: Order[], 
    paymentInfo: DeliveryPaymentInfo,
    deliveryId?: string,
    client?: Client
) {
    return prepareDeliveryReceiptForPreview(undefined, paymentInfo, deliveryId, client, orders);
}
