import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { PaymentReceiptDocument } from '../ui/PaymentReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import { clientApi } from '@/shared/api/clientApi';
import { systemSettingsApi } from '@/features/system-settings/api/systemSettingsApi';

export async function generatePaymentReceipt(order: Order, payments: any[], userName: string) {
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
