import type { Order, OrderPayload } from './types'
import { validateOrderPayload } from './model'

// Helper to generate dates relative to today
const getRelativeDate = (daysOffset: number = 0, hoursOffset: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(date.getHours() + hoursOffset);
    return date.toISOString();
};

const getRelativeDateOnly = (daysOffset: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
};

const MOCK_ORDERS: Order[] = [
    {
        id: '101',
        receiptNumber: 'REC-001',
        salesChannel: 'OFICINA',
        type: 'NORMAL',
        clientId: '1',
        clientName: 'Maria Fernanda Gonzalez',
        brandName: 'SHEIN',
        brandId: '1',
        createdAt: getRelativeDate(0, -2), // Today, 2 hours ago
        possibleDeliveryDate: getRelativeDate(5), // 5 days from now
        status: 'RECIBIDO_EN_BODEGA',
        total: 150.00,
        realInvoiceTotal: 150.00,
        receptionDate: getRelativeDate(0, -2), // Today, 2 hours ago
        invoiceNumber: `BATCH-${getRelativeDateOnly(0)}-001`,
        deposit: 0,
        // REMOVED: paidAmount - Use getPaidAmount() instead
        payments: [
            { id: 'pay-101-init', amount: 100.00, method: 'EFECTIVO', bankAccountId: '2', createdAt: getRelativeDate(0, -2), description: 'Abono inicial' }
        ],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item1', productName: 'Red Dress', quantity: 2, unitPrice: 50.00 },
            { id: 'item2', productName: 'Shoes', quantity: 1, unitPrice: 50.00 }
        ]
    },
    {
        id: '105',
        receiptNumber: 'REC-005',
        salesChannel: 'OFICINA',
        type: 'PREVENTA',
        clientId: '1',
        clientName: 'Maria Fernanda Gonzalez',
        brandName: 'Nike',
        brandId: '2',
        createdAt: getRelativeDate(0, -1), // Today, 1 hour ago
        possibleDeliveryDate: getRelativeDate(8), // 8 days from now
        status: 'RECIBIDO_EN_BODEGA',
        total: 95.00,
        realInvoiceTotal: 95.00,
        receptionDate: getRelativeDate(0, -1), // Today, 1 hour ago
        invoiceNumber: `BATCH-${getRelativeDateOnly(0)}-510`,
        deposit: 0,
        // REMOVED: paidAmount - Use getPaidAmount() instead
        payments: [
            { id: 'pay-105-init', amount: 30.00, method: 'EFECTIVO', bankAccountId: '2', createdAt: getRelativeDate(0, -1), description: 'Abono inicial' },
            { id: 'pay-105-add', amount: 65.00, method: 'TRANSFERENCIA', bankAccountId: '1', reference: '123', createdAt: getRelativeDate(0, 0), description: 'Abono posterior' }
        ],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item8', productName: 'T-Shirt', quantity: 3, unitPrice: 25.00 },
            { id: 'item9', productName: 'Socks Pack', quantity: 1, unitPrice: 20.00 }
        ]
    },
    {
        id: '102',
        receiptNumber: 'REC-002',
        salesChannel: 'WHATSAPP',
        type: 'PREVENTA',
        clientId: '2',
        clientName: 'Ana Lucia Perez',
        brandName: 'Nike',
        brandId: '2',
        createdAt: getRelativeDate(-1, 0), // Yesterday
        possibleDeliveryDate: getRelativeDate(5), // 5 days from now
        status: 'POR_RECIBIR',
        total: 75.50,
        deposit: 0,
        // REMOVED: paidAmount - Use getPaidAmount() instead
        payments: [
            { id: 'pay-102-init', amount: 75.50, method: 'TRANSFERENCIA', bankAccountId: '1', createdAt: getRelativeDate(-1, 0), description: 'Abono inicial' }
        ],
        paymentMethod: 'TRANSFERENCIA',
        bankAccountId: '1',
        transactionDate: getRelativeDateOnly(-1), // Yesterday
        items: [
            { id: 'item3', productName: 'Bag', quantity: 1, unitPrice: 75.50 }
        ]
    },
    {
        id: '103',
        receiptNumber: 'REC-003',
        salesChannel: 'OFICINA',
        type: 'REPROGRAMACION',
        clientId: '1',
        clientName: 'Maria Fernanda Gonzalez',
        brandName: 'Adidas',
        brandId: '3',
        createdAt: getRelativeDate(-2, 0), // 2 days ago
        possibleDeliveryDate: getRelativeDate(2), // 2 days from now
        status: 'POR_RECIBIR',
        total: 203.00,
        deposit: 0,
        // REMOVED: paidAmount - Use getPaidAmount() instead
        payments: [],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item4', productName: 'Running Shoes', quantity: 1, unitPrice: 120.00 },
            { id: 'item5', productName: 'Sports Bag', quantity: 1, unitPrice: 83.00 }
        ]
    },
    {
        id: '107',
        receiptNumber: 'REC-007',
        salesChannel: 'DOMICILIO',
        type: 'NORMAL',
        clientId: '2',
        clientName: 'Ana Lucia Perez',
        brandName: 'SHEIN',
        brandId: '1',
        createdAt: getRelativeDate(-1, 0), // Yesterday
        possibleDeliveryDate: getRelativeDate(3), // 3 days from now
        status: 'POR_RECIBIR',
        total: 45.00,
        deposit: 0,
        // REMOVED: paidAmount - Use getPaidAmount() instead
        payments: [
            { id: 'pay-107-init', amount: 45.00, method: 'EFECTIVO', bankAccountId: '2', createdAt: getRelativeDate(-1, 0), description: 'Abono inicial' }
        ],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item11', productName: 'Accessories Set', quantity: 1, unitPrice: 45.00 }
        ]
    }
]

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

export const orderApi = {
    getAll: async (): Promise<Order[]> => {
        await delay()
        return [...MOCK_ORDERS]
    },
    getById: async (id: string): Promise<Order | undefined> => {
        await delay()
        return MOCK_ORDERS.find(p => p.id === id)
    },
    getByClient: async (clientId: string): Promise<Order[]> => {
        await delay()
        return MOCK_ORDERS.filter(p => p.clientId === clientId)
    },
    create: async (payload: OrderPayload): Promise<Order> => {
        validateOrderPayload(payload);
        await delay(500)
        const newOrder: Order = {
            id: String(Date.now()),
            ...payload,
            deposit: 0, // Always 0 — initial payment goes through payments[]
            createdAt: new Date().toISOString(),
            payments: payload.payments || [],
            // REMOVED: paidAmount - Calculated dynamically with getPaidAmount()
        }
        MOCK_ORDERS.push(newOrder)
        return newOrder
    },
    update: async (id: string, payload: Partial<OrderPayload>): Promise<Order> => {
        await delay(500)
        const idx = MOCK_ORDERS.findIndex(p => p.id === id)
        if (idx === -1) throw new Error('Order not found')
        MOCK_ORDERS[idx] = { ...MOCK_ORDERS[idx], ...payload }
        return MOCK_ORDERS[idx]
    },

    /**
     * Syncs the denormalized clientName across all orders for a given clientId.
     * Only touches clientName — never modifies financials, status, or other fields.
     */
    syncClientName: async (clientId: string, newName: string): Promise<void> => {
        MOCK_ORDERS.forEach((order, idx) => {
            if (order.clientId === clientId) {
                MOCK_ORDERS[idx] = { ...order, clientName: newName }
            }
        })
    },
}
