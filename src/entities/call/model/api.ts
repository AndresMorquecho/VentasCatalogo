import type { Call, CallPayload } from './types'

const MOCK_CALLS: Call[] = [
    {
        id: 'L1',
        clientId: '1',
        type: 'FOLLOW_UP',
        result: 'ANSWERED',
        dateTime: '2025-02-10T09:00:00Z',
        notes: 'We talked about the pending order',
        durationSeconds: 120
    }
]

const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms))

export const callApi = {
    getAll: async (): Promise<Call[]> => {
        await delay()
        return [...MOCK_CALLS]
    },
    getByClient: async (clientId: string): Promise<Call[]> => {
        await delay()
        return MOCK_CALLS.filter(l => l.clientId === clientId)
    },
    create: async (data: CallPayload): Promise<Call> => {
        await delay()
        const newCall: Call = {
            id: String(Date.now()),
            dateTime: new Date().toISOString(),
            ...data
        }
        MOCK_CALLS.push(newCall)
        return newCall
    },
    update: async (id: string, data: Partial<CallPayload>): Promise<Call> => {
        await delay()
        const idx = MOCK_CALLS.findIndex(l => l.id === id)
        if (idx === -1) throw new Error('Call not found')
        MOCK_CALLS[idx] = { ...MOCK_CALLS[idx], ...data }
        return MOCK_CALLS[idx]
    }
}
