import type { Deposit, DepositPayload } from './types'

const MOCK_DEPOSITS: Deposit[] = [
    {
        id: '9001',
        clientId: '1',
        bank: 'PICHINCHA',
        referenceNumber: 'REF12345',
        amount: 100.00,
        date: '2025-02-01',
        status: 'PENDING'
    }
]

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

export const depositApi = {
    getAll: async (): Promise<Deposit[]> => {
        await delay()
        return [...MOCK_DEPOSITS]
    },
    getByClient: async (clientId: string): Promise<Deposit[]> => {
        await delay()
        return MOCK_DEPOSITS.filter(d => d.clientId === clientId)
    },
    create: async (payload: DepositPayload): Promise<Deposit> => {
        await delay()
        const newObj = { id: String(Date.now()), ...payload }
        MOCK_DEPOSITS.push(newObj)
        return newObj
    },
    update: async (id: string, payload: Partial<DepositPayload>): Promise<Deposit> => {
        await delay()
        const idx = MOCK_DEPOSITS.findIndex(d => d.id === id)
        if (idx === -1) throw new Error('Deposit not found')
        MOCK_DEPOSITS[idx] = { ...MOCK_DEPOSITS[idx], ...payload }
        return MOCK_DEPOSITS[idx]
    }
}
