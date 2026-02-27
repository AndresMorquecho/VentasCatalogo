
import { pdf } from '@react-pdf/renderer';
import { PaymentReceiptDocument } from '../ui/PaymentReceiptDocument';
import type { Order } from '@/entities/order/model/types';

export const generatePaymentReceipt = async (order: Order, payments: any[], userName: string) => {
    const blob = await pdf(<PaymentReceiptDocument order={order} payments={payments} userName={userName} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estado-cuenta-${order.receiptNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
