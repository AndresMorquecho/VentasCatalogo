import { createElement } from 'react';
import { CreditDistributionSummaryDocument } from '../ui/CreditDistributionSummaryDocument';
import type { Order } from '@/entities/order/model/types';
import type { CreditDistribution } from '@/entities/financial-record/model/types';

/** Une pedidos activos y destinos de distribución usando la lista de contexto (página actual). */
export function buildOrdersByIdForDistributionPdf(
    active: Order[],
    creditDistributions: Record<string, CreditDistribution>,
    contextOrders: Order[]
): Record<string, Order> {
    const map: Record<string, Order> = {};
    for (const o of active) map[o.id] = o;
    for (const dist of Object.values(creditDistributions)) {
        for (const line of dist.distributions || []) {
            if (line.targetOrderId && !map[line.targetOrderId]) {
                const found = contextOrders.find((x) => x.id === line.targetOrderId);
                if (found) map[line.targetOrderId] = found;
            }
        }
    }
    return map;
}

export function prepareCreditDistributionSummaryForPreview(params: {
    distributions: CreditDistribution[];
    ordersById: Record<string, Order>;
    deliveryNumber: string;
    clientName: string;
    username?: string;
    /** Saldo total disponible en billetera del cliente tras la entrega (API), para filas a billetera virtual */
    clientWalletTotalAfter?: number | null;
}) {
    const formattedDate = new Date().toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    const document = createElement(CreditDistributionSummaryDocument, {
        ...params,
        formattedDate,
    });

    const safeNum = params.deliveryNumber.replace(/\s+/g, '_');
    return {
        document,
        fileName: `distribucion-saldo-${safeNum || 'entrega'}.pdf`,
        title: 'Distribución de saldo a favor',
    };
}
