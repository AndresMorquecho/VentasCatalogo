export type InventoryMovementType = 'ENTRY' | 'DELIVERED' | 'RETURNED';

// ⚠️ No incluir valores monetarios. Solo trazabilidad física.
export type InventoryMovement = {
    id: string; // Unique Movement ID
    orderId: string; // FK to Order
    clientId: string; // FK to Client
    brandId: string; // FK to Brand
    type: InventoryMovementType;
    date: string; // ISO String
    createdBy: string; // User ID/Name
    notes?: string;
    deliveryDetails?: {
        deliveredTo?: string; // Person receiving package
        deliveryDate?: string;
    };
};
