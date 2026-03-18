import { createElement } from 'react';
import { OrderLabelsDocument } from '../ui/OrderLabelsDocument';
import type { Order } from '@/entities/order/model/types';

/**
 * Prepara el documento PDF de etiquetas de pedidos para preview
 * Esta función NO descarga automáticamente, sino que retorna el elemento React
 * para ser usado con el PDFPreviewModal
 */
export async function prepareOrderLabelsForPreview(orders: Order[]) {
    try {
        const element = createElement(OrderLabelsDocument, { orders } as any);
        
        const dateStr = new Date().toISOString().split('T')[0];
        
        return {
            document: element,
            fileName: `etiquetas-recepcion-${dateStr}.pdf`,
            title: `Etiquetas de Recepción - ${orders.length} pedidos`
        };
    } catch (error) {
        console.error('Error preparando etiquetas PDF:', error);
        throw error;
    }
}
