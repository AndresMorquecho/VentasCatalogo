export type InventoryMovementType = 'ENTRY' | 'DELIVERED' | 'RETURNED';

export type InventoryMovement = {
    id: string;
    orderId: string;
    clientId: string;
    brandId: string;
    type: InventoryMovementType;
    date?: string;
    createdAt: string;
    createdBy: string;
    notes?: string;
    deliveryDetails?: {
        deliveredTo?: string;
        deliveryDate?: string;
    };
    client?: { firstName: string; lastName?: string };
    order?: { receiptNumber: string; brandName: string };
    brand?: { name: string };
};
