
import { pdf } from '@react-pdf/renderer';
import { DeliveryReceiptDocument } from '../ui/DeliveryReceiptDocument';
import { clientApi } from '@/shared/api/clientApi';
import type { Order } from '@/entities/order/model/types';
// Removed file-saver dependency

export const generateDeliveryReceipt = async (order: Order, paymentInfo?: any) => {
    try {
        console.log("Generando comprobante de entrega...", order);

        // Fetch client details using getById for performance
        const client = await clientApi.getById(order.clientId);

        const blob = await pdf(
            <DeliveryReceiptDocument
                order={order}
                client={client}
                paymentInfo={paymentInfo}
            />
        ).toBlob();

        const fileName = `Entrega-${order.receiptNumber}-${new Date().getTime()}.pdf`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;

        // Append to body is crucial for some browsers
        document.body.appendChild(link);
        link.click();

        // Cleanup with small delay
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        return true;
    } catch (error) {
        console.error("Error generating delivery PDF:", error);
        return false;
    }
};
