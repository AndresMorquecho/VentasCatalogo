import { createElement } from 'react';
import { ExchangeShipmentDocument } from '../ui/ExchangeShipmentDocument';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import { clientApi } from '@/shared/api/clientApi';

/**
 * Prepara el documento PDF de guía de envío de cambio para preview.
 * CAM no se muestra aquí; el correlativo pequeño es Guia-AAAA-NNN (guideSequential).
 */
export async function prepareExchangeShipmentReceiptForPreview(
    orders: Order[],
    user?: User,
    trackingGuide?: string,
    notes?: string,
    guideSequentialOverride?: string
) {
    try {
        if (orders.length === 0) throw new Error('No orders provided');

        const firstOrder = orders[0];

        let client = null;
        try {
            client = await clientApi.getById(firstOrder.clientId);
        } catch (e) {
            console.warn('Could not fetch client details for PDF');
        }

        const formattedDate = new Date().toLocaleString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).replace(',', '');

        const displayGuide = trackingGuide || firstOrder.trackingGuide || 'S/G';
        const guideSequential =
            guideSequentialOverride ||
            orders.map((o) => (o as any).exchangeShippingGuideSeq).find(Boolean) ||
            undefined;

        const element = createElement(ExchangeShipmentDocument, {
            orders,
            user,
            client,
            trackingGuide: displayGuide,
            guideSequential,
            formattedDate,
            notes: notes || '',
        } as any);

        const fileSlug = String(displayGuide).replace(/\s+/g, '_');
        return {
            document: element,
            fileName: `guia-envio-${fileSlug}.pdf`,
            title: `Guía de Envío — ${displayGuide}`,
        };
    } catch (error) {
        console.error('Error preparando guía de envío PDF:', error);
        throw error;
    }
}
