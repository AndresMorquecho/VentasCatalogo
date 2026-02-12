import type { Order, OrderPayload } from './types'

const MOCK_ORDERS: Order[] = [
    {
        id: '101',
        receiptNumber: 'REC-001',
        salesChannel: 'OFICINA',
        type: 'NORMAL',
        clientId: '1',
        clientName: 'Maria Fernanda Gonzalez',
        brandName: 'SHEIN',
        createdAt: '2025-01-20T10:00:00Z',
        possibleDeliveryDate: '2025-02-05T00:00:00Z',
        status: 'POR_RECIBIR',
        total: 150.00,
        deposit: 50.00,
        // Eliminado balance
        paidAmount: 50.00,
        payments: [],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item1', productName: 'Red Dress', quantity: 2, unitPrice: 50.00 },
            { id: 'item2', productName: 'Shoes', quantity: 1, unitPrice: 50.00 }
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
        createdAt: '2025-01-21T14:30:00Z',
        possibleDeliveryDate: '2025-02-10T00:00:00Z',
        status: 'POR_RECIBIR',
        total: 75.50,
        deposit: 75.50,
        paidAmount: 75.50,
        payments: [],
        paymentMethod: 'TRANSFERENCIA',
        bankAccountId: 'bank1',
        transactionDate: '2025-01-21',
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
        createdAt: '2025-01-15T09:00:00Z',
        possibleDeliveryDate: '2025-01-30T00:00:00Z',
        status: 'ATRASADO',
        total: 203.00,
        deposit: 0.00,
        paidAmount: 0.00,
        payments: [],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item4', productName: 'Running Shoes', quantity: 1, unitPrice: 120.00 },
            { id: 'item5', productName: 'Sports Bag', quantity: 1, unitPrice: 83.00 }
        ]
    },
    {
        id: '104',
        receiptNumber: 'REC-004',
        salesChannel: 'WHATSAPP',
        type: 'NORMAL',
        clientId: '2',
        clientName: 'Ana Lucia Perez',
        brandName: 'SHEIN',
        createdAt: '2025-01-22T16:00:00Z',
        possibleDeliveryDate: '2025-01-25T00:00:00Z',
        status: 'RECIBIDO',
        total: 320.00,
        deposit: 320.00,
        paidAmount: 320.00,
        payments: [],
        paymentMethod: 'TRANSFERENCIA',
        bankAccountId: 'bank2',
        transactionDate: '2025-01-22',
        items: [
            { id: 'item6', productName: 'Evening Dress', quantity: 1, unitPrice: 180.00 },
            { id: 'item7', productName: 'Heels', quantity: 1, unitPrice: 140.00 }
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
        createdAt: '2025-01-25T11:00:00Z',
        possibleDeliveryDate: '2025-02-15T00:00:00Z',
        status: 'POR_RECIBIR',
        total: 95.00,
        deposit: 30.00,
        paidAmount: 30.00,
        payments: [],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item8', productName: 'T-Shirt', quantity: 3, unitPrice: 25.00 },
            { id: 'item9', productName: 'Socks Pack', quantity: 1, unitPrice: 20.00 }
        ]
    },
    {
        id: '106',
        receiptNumber: 'REC-006',
        salesChannel: 'WHATSAPP',
        type: 'NORMAL',
        clientId: '2',
        clientName: 'Ana Lucia Perez',
        brandName: 'Adidas',
        createdAt: '2025-01-10T08:30:00Z',
        possibleDeliveryDate: '2025-01-20T00:00:00Z',
        status: 'ATRASADO',
        total: 180.00,
        deposit: 50.00,
        paidAmount: 50.00,
        payments: [],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item10', productName: 'Jacket', quantity: 1, unitPrice: 180.00 }
        ]
    },
    {
        id: '107',
        receiptNumber: 'REC-007',
        salesChannel: 'DOMICILIO',
        type: 'NORMAL',
        clientId: '1',
        clientName: 'Maria Fernanda Gonzalez',
        brandName: 'SHEIN',
        createdAt: '2025-02-01T13:00:00Z',
        possibleDeliveryDate: '2025-02-05T00:00:00Z',
        status: 'RECIBIDO',
        total: 45.00,
        deposit: 45.00,
        paidAmount: 45.00,
        payments: [],
        paymentMethod: 'EFECTIVO',
        items: [
            { id: 'item11', productName: 'Accessories Set', quantity: 1, unitPrice: 45.00 }
        ]
    },
    {
        id: '108',
        receiptNumber: 'REC-008',
        salesChannel: 'WHATSAPP',
        type: 'NORMAL',
        clientId: '2',
        clientName: 'Ana Lucia Perez',
        brandName: 'Nike',
        createdAt: '2025-02-05T10:00:00Z',
        possibleDeliveryDate: '2025-02-05T00:00:00Z',
        status: 'CANCELADO',
        total: 260.00,
        deposit: 0.00,
        paidAmount: 0.00,
        payments: [],
        paymentMethod: 'TRANSFERENCIA',
        bankAccountId: 'bank1',
        items: [
            { id: 'item12', productName: 'Air Max', quantity: 1, unitPrice: 260.00 }
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
        await delay(500)
        const newOrder: Order = {
            id: String(Date.now()),
            ...payload,
            createdAt: new Date().toISOString(),
            payments: [],
            paidAmount: payload.deposit
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
    }
}
