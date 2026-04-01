import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { OrderReceiptDocument } from '../ui/OrderReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';

import { clientApi } from '@/shared/api/clientApi';
import { bankAccountApi } from '@/shared/api/bankAccountApi';
import { systemSettingsApi } from '@/features/system-settings/api/systemSettingsApi';

export async function generateOrderReceipt(order: Order, user?: User) {
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
        // @ts-ignore
        const element = createElement(OrderReceiptDocument, { order, user, client, settings, bank });
        
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
