import type { InventoryMovement } from "@/entities/inventory-movement/model/types";

// Mock Data
let movements: InventoryMovement[] = [];

// Service API
export const inventoryApi = {
    // 1️⃣ Create Movement
    create: async (data: Omit<InventoryMovement, 'id' | 'date'>): Promise<InventoryMovement> => {
        const newMovement: InventoryMovement = {
            id: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: new Date().toISOString(),
            ...data,
        };
        movements.push(newMovement);
        console.log(`[InventoryAPI] Movement created: ${data.type} for Order ${data.orderId}`);
        return newMovement;
    },

    // 2️⃣ Fetch ALL Movements (For Inventory Dashboard)
    getAll: async (): Promise<InventoryMovement[]> => {
        // Return reverse chronological order (Newest first)
        return [...movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    // 3️⃣ Fetch Movements by Client
    getByClient: async (clientId: string): Promise<InventoryMovement[]> => {
        return (await inventoryApi.getAll()).filter(m => m.clientId === clientId);
    },

    // 4️⃣ Fetch Movements by Order ID
    getByOrder: async (orderId: string): Promise<InventoryMovement[]> => {
        return (await inventoryApi.getAll()).filter(m => m.orderId === orderId);
    },

    // 5️⃣ Update Delivery (Just a helper to complete a movement lifecycle)
    markDelivered: async (id: string, deliveryDate: string) => {
        const movement = movements.find(m => m.id === id);
        if (movement) {
            movement.deliveryDetails = { deliveryDate };
        }
    }
};
