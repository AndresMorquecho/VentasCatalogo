import { createElement } from 'react';
import { ExchangeShipmentDocument } from '../ui/ExchangeShipmentDocument';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import { clientApi } from '@/shared/api/clientApi';

/**
 * Prepara el documento PDF de guía de envío de cambio para preview
 */
export async function prepareExchangeShipmentReceiptForPreview(orders: Order[], user?: User, trackingGuide?: string, notes?: string) {
    try {
        if (orders.length === 0) throw new Error('No orders provided');
        
        const firstOrder = orders[0];
        
        // Fetch full client details
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
            hour12: false
        }).replace(',', '');

        const displayGuide = trackingGuide || firstOrder.trackingGuide || 'S/G';
        
        // Create the React element
        const element = createElement(ExchangeShipmentDocument, { 
            orders, 
            user, 
            client, 
            trackingGuide: displayGuide,
            formattedDate,
            notes: notes || ''
        } as any);
        
        return {
            document: element,
            fileName: `guia-envio-${displayGuide}.pdf`,
            title: `Guía de Envío - ${displayGuide}`
        };
    } catch (error) {
        console.error('Error preparando guía de envío PDF:', error);
        throw error;
    }
}
