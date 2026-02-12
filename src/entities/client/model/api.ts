import type { Client, ClientPayload } from './types'

const MOCK_CLIENTS: Client[] = [
    {
        id: '1',
        name: 'Maria Fernanda Gonzalez',
        idCard: '1723456789',
        phone: '0998765432',
        address: 'Av. Amazonas y Colon',
        city: 'Quito',
        status: 'ACTIVE',
        level: 'GOLD',
        notes: 'Excellent client',
        registeredAt: '2024-05-15'
    },
    {
        id: '2',
        name: 'Ana Lucia Perez',
        idCard: '1712345678',
        phone: '0987654321',
        address: 'Calle 10 de Agosto',
        city: 'Guayaquil',
        status: 'PENDING',
        level: 'BRONZE',
        registeredAt: '2025-01-20'
    }
]

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms))

export const clientApi = {
    getAll: async (): Promise<Client[]> => {
        await delay()
        return [...MOCK_CLIENTS]
    },

    getById: async (id: string): Promise<Client | undefined> => {
        await delay()
        return MOCK_CLIENTS.find(c => c.id === id)
    },

    create: async (payload: ClientPayload): Promise<Client> => {
        await delay(600)
        const newClient: Client = {
            id: String(Date.now()),
            ...payload,
            registeredAt: new Date().toISOString()
        }
        MOCK_CLIENTS.push(newClient)
        return newClient
    },

    update: async (id: string, payload: Partial<ClientPayload>): Promise<Client> => {
        await delay(500)
        const index = MOCK_CLIENTS.findIndex(c => c.id === id)
        if (index === -1) throw new Error('Client not found')

        const updated = { ...MOCK_CLIENTS[index], ...payload }
        MOCK_CLIENTS[index] = updated
        return updated
    }
}
