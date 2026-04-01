import { createElement } from 'react';
import { PaymentReceiptDocument } from '../ui/PaymentReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import { clientApi } from '@/shared/api/clientApi';
import { systemSettingsApi } from '@/features/system-settings/api/systemSettingsApi';

/**
 * Prepara el estado de cuenta PDF para preview
 */
export async function preparePaymentReceiptForPreview(order: Order, payments: any[], userName: string) {
    try {
        const client = await clientApi.getById(order.clientId);

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
            console.warn('Could not fetch settings for PDF payment receipt');
        }

        const element = createElement(PaymentReceiptDocument, { order, payments, userName, client, settings });
        
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
