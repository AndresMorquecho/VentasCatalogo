import type { User, UserPayload } from './types'

const MOCK_USERS: User[] = [
    {
        id: '1',
        name: 'Main Admin',
        email: 'admin@business.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: '2025-01-01',
        lastAccess: '2025-02-10'
    },
    {
        id: '2',
        name: 'Logistics Operator',
        email: 'operator@business.com',
        role: 'OPERATOR',
        status: 'ACTIVE',
        createdAt: '2025-01-15'
    }
]

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

export const userApi = {
    getAll: async (): Promise<User[]> => {
        await delay()
        return [...MOCK_USERS]
    },

    getById: async (id: string): Promise<User | undefined> => {
        await delay()
        return MOCK_USERS.find(u => u.id === id)
    },

    create: async (payload: UserPayload): Promise<User> => {
        await delay(500)
        const newUser: User = {
            id: String(Date.now()),
            ...payload,
            createdAt: new Date().toISOString().split('T')[0]
        }
        MOCK_USERS.push(newUser)
        return newUser
    },

    update: async (id: string, payload: Partial<UserPayload>): Promise<User> => {
        await delay(500)
        const index = MOCK_USERS.findIndex(u => u.id === id)
        if (index === -1) throw new Error('User not found')
        
        const updatedUser = {
            ...MOCK_USERS[index],
            ...payload
        }
        MOCK_USERS[index] = updatedUser
        return updatedUser
    }
}
