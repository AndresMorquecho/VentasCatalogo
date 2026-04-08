import { createElement } from 'react';
import { ExchangeReceiptDocument } from '../ui/ExchangeReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import { clientApi } from '@/shared/api/clientApi';
import { systemSettingsApi } from '@/features/system-settings/api/systemSettingsApi';

/**
 * Prepara el documento PDF de recibo de cambio para preview
 */
export async function prepareExchangeReceiptForPreview(orders: Order[], user?: User, receiptNumber?: string, notes?: string) {
    try {
        if (orders.length === 0) throw new Error('No orders provided');
        
        const firstOrder = orders[0];
        
        // Fetch full client details
        const client = await clientApi.getById(firstOrder.clientId);

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

        const formattedDate = new Date().toLocaleString('es-EC', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');

        const displayConsecutive = firstOrder.orderNumber || receiptNumber || firstOrder.receiptNumber || 'REC-CAMBIO';
        
        // Create the React element
        const element = createElement(ExchangeReceiptDocument, { 
            orders, 
            user, 
            client, 
            receiptNumber: displayConsecutive,
            formattedDate,
            notes: notes || firstOrder.notes || ''
        } as any);
        
        return {
            document: element,
            fileName: `recibo-cambio-${displayConsecutive}.pdf`,
            title: `Recibo de Cambio - ${displayConsecutive}`
        };
    } catch (error) {
        console.error('Error preparando recibo de cambio PDF:', error);
        throw error;
    }
}
