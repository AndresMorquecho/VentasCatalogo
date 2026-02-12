import type { Delivery, DeliveryPayload } from './types'

const MOCK_DELIVERIES: Delivery[] = [
    {
        id: '301',
        orderId: '101',
        scheduledDate: '2025-01-25',
        address: 'Av. Principal 123',
        status: 'SCHEDULED'
    }
]

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

export const deliveryApi = {
    getAll: async (): Promise<Delivery[]> => {
        await delay()
        return [...MOCK_DELIVERIES]
    },
    getByOrder: async (orderId: string): Promise<Delivery[]> => {
        await delay()
        return MOCK_DELIVERIES.filter(e => e.orderId === orderId)
    },
    create: async (data: DeliveryPayload): Promise<Delivery> => {
        await delay()
        const newDelivery = { id: String(Date.now()), ...data }
        MOCK_DELIVERIES.push(newDelivery)
        return newDelivery
    },
    update: async (id: string, data: Partial<DeliveryPayload>): Promise<Delivery> => {
        await delay()
        const idx = MOCK_DELIVERIES.findIndex(e => e.id === id)
        if (idx === -1) throw new Error('Delivery not found')
        MOCK_DELIVERIES[idx] = { ...MOCK_DELIVERIES[idx], ...data }
        return MOCK_DELIVERIES[idx]
    }
}
