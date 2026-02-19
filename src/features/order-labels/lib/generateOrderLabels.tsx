import { pdf } from '@react-pdf/renderer';
import { OrderLabelsDocument } from '../ui/OrderLabelsDocument';
import type { Order } from '@/entities/order/model/types';
import type { Client } from '@/entities/client/model/types';

interface GenerateOptions {
    orders: Order[];
    clients: Client[];
    user?: { name: string };
}

export async function generateOrderLabels({ orders, clients, user }: GenerateOptions): Promise<void> {
    if (orders.length === 0) return;

    const clientsMap = clients.reduce((acc, client) => {
        acc[client.id] = client;
        return acc;
    }, {} as Record<string, Client>);

    try {
        const doc = (
            <OrderLabelsDocument
                orders={orders}
                clientsMap={clientsMap}
                user={user}
            />
        );

        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `etiquetas-recepcion-${dateStr}.pdf`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Error generating labels PDF:", error);
        throw error;
    }
}
