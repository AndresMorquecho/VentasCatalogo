import { createElement } from 'react';
import { OrderReceiptDocument } from '../ui/OrderReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import { clientApi } from '@/shared/api/clientApi';
import { systemSettingsApi } from '@/features/system-settings/api/systemSettingsApi';

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
        // Fetch settings and default note
        let settings = { location: "Quito - Ecuador", phone: "2787237", support_phone: "", note: "" };
        try {
            const [settingsData, noteData] = await Promise.all([
                systemSettingsApi.getSettings(),
                systemSettingsApi.getDefaultNote()
            ]);

            settingsData.forEach(s => {
                if (s.key === 'location') settings.location = s.value;
                if (s.key === 'phone') settings.phone = s.value;
                if (s.key === 'support_phone') settings.support_phone = s.value;
            });

            if (noteData && noteData.content) {
                settings.note = noteData.content;
            }
        } catch (e) {
            console.warn('Could not fetch settings for PDF receipt');
        }

        // Create the React element
        const element = createElement(OrderReceiptDocument, { 
            order, 
            user, 
            client, 
            childOrders, 
            bank,
            settings
        } as any);
        
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
