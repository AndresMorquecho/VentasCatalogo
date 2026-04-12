import { createElement } from 'react';
import { ExchangeReceiptDocument } from '../ui/ExchangeReceiptDocument';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import { clientApi } from '@/shared/api/clientApi';
import { systemSettingsApi } from '@/features/system-settings/api/systemSettingsApi';

function resolveCamConsecutive(orders: Order[], legacy?: string): string | undefined {
    const fromOrderNum = orders
        .map((o) => o.orderNumber)
        .find((n) => n && /^CAM-/i.test(String(n).trim()));
    if (fromOrderNum) return String(fromOrderNum).trim();
    const fromReceipt = orders
        .map((o) => o.receiptNumber)
        .find((n) => n && /^CAM-/i.test(String(n).trim()));
    if (fromReceipt) return String(fromReceipt).trim();
    if (legacy && /^CAM-/i.test(String(legacy).trim())) return String(legacy).trim();
    return undefined;
}

/**
 * Prepara el documento PDF de recibo de cambio para preview
 */
export async function prepareExchangeReceiptForPreview(orders: Order[], user?: User, _legacyReceiptArg?: string, notes?: string) {
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

        const exchangeConsecutive = resolveCamConsecutive(orders, _legacyReceiptArg);

        const rawRef =
            firstOrder.receiptNumber || (firstOrder as any)?.receipt?.receiptNumber || '';
        const salesRef =
            rawRef && !/^CAM-/i.test(String(rawRef).trim()) ? String(rawRef).trim() : '';

        const element = createElement(ExchangeReceiptDocument, {
            orders,
            user,
            client,
            exchangeConsecutive,
            salesReceiptReference: salesRef || undefined,
            formattedDate,
            notes: notes || firstOrder.notes || '',
        } as any);

        const fileSlug = (
            exchangeConsecutive ||
            salesRef ||
            firstOrder.id ||
            'cambio'
        )
            .toString()
            .replace(/\s+/g, '_');
        return {
            document: element,
            fileName: `recibo-cambio-${fileSlug}.pdf`,
            title: exchangeConsecutive
                ? `Recibo de Cambio · ${exchangeConsecutive}`
                : salesRef
                  ? `Recibo de Cambio · ${salesRef}`
                  : 'Recibo de Cambio',
        };
    } catch (error) {
        console.error('Error preparando recibo de cambio PDF:', error);
        throw error;
    }
}
