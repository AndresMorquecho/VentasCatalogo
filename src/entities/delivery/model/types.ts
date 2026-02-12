export type DeliveryStatus = 'SCHEDULED' | 'IN_ROUTE' | 'DELIVERED' | 'FAILED';

export interface Delivery {
    id: string;
    orderId: string;
    scheduledDate: string;
    realDate?: string;
    status: DeliveryStatus;
    address: string;
    courierId?: string;
    notes?: string;
}

export interface DeliveryPayload {
    orderId: string;
    scheduledDate: string;
    address: string;
    courierId?: string;
    status: DeliveryStatus;
}
