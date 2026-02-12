import type { Payment, PaymentPayload } from './types'

const MOCK_PAYMENTS: Payment[] = [
    {
        id: '201',
        orderId: '101',
        date: '2025-01-22',
        amount: 50.00,
        method: 'CASH',
        status: 'CONFIRMED',
        notes: 'Advance'
    }
]

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

export const paymentApi = {
    getAll: async (): Promise<Payment[]> => [...MOCK_PAYMENTS],
    
    getByOrder: async (orderId: string): Promise<Payment[]> => {
        await delay()
        return MOCK_PAYMENTS.filter(a => a.orderId === orderId)
    },

    create: async (payload: PaymentPayload): Promise<Payment> => {
        await delay()
        const newPayment: Payment = {
            id: String(Date.now()),
            ...payload,
            date: new Date().toISOString()
        }
        MOCK_PAYMENTS.push(newPayment)
        return newPayment
    },

    update: async (id: string, payload: Partial<PaymentPayload>): Promise<Payment> => {
        await delay()
        const idx = MOCK_PAYMENTS.findIndex(a => a.id === id)
        if (idx === -1) throw new Error('Payment not found')
        MOCK_PAYMENTS[idx] = { ...MOCK_PAYMENTS[idx], ...payload }
        return MOCK_PAYMENTS[idx]
    }
}
