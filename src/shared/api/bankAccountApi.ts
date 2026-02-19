import type { BankAccount, BankAccountPayload } from '@/entities/bank-account/model/types'

const MOCK_BANK_ACCOUNTS: BankAccount[] = [
    {
        id: '1',
        name: 'Banco Pichincha - Ahorros',
        type: 'BANK',
        currentBalance: 1500.50,
        isActive: true,
        createdAt: '2025-01-01T10:00:00Z',
        holderName: 'Juan Pérez',
        bankName: 'Banco Pichincha',
        accountNumber: '1234567890',
        description: 'Cuenta de Ahorros Principal'
    },
    {
        id: '2',
        name: 'Caja Chica Oficina',
        type: 'CASH',
        currentBalance: 300.00,
        isActive: true,
        createdAt: '2025-01-05T12:00:00Z',
        holderName: 'Administración',
        bankName: 'Efectivo',
        accountNumber: 'N/A',
        description: 'Caja menor para gastos diarios'
    },
    {
        id: '3',
        name: 'Banco Guayaquil - Corriente',
        type: 'BANK',
        currentBalance: 5000.00,
        isActive: false,
        createdAt: '2025-01-10T09:00:00Z',
        holderName: 'Empresa SA',
        bankName: 'Banco Guayaquil',
        accountNumber: '0987654321',
        description: 'Cuenta Corriente Operativa'
    }
]

const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

export const bankAccountApi = {
    getAll: async (): Promise<BankAccount[]> => {
        await delay()
        return [...MOCK_BANK_ACCOUNTS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    
    // Explicitly exposing internal state for Transactional API usage (Shared Kernel pattern for Mocks)
    // In real backend, this would be DB access
    _getRawData: () => MOCK_BANK_ACCOUNTS,

    getById: async (id: string): Promise<BankAccount | undefined> => {
        await delay()
        return MOCK_BANK_ACCOUNTS.find(a => a.id === id)
    },

    create: async (payload: BankAccountPayload): Promise<BankAccount> => {
        await delay()
        const newAccount: BankAccount = {
            id: crypto.randomUUID(),
            ...payload,
            createdAt: new Date().toISOString(),
            holderName: 'Sin Asignar',
            bankName: payload.type === 'CASH' ? 'Efectivo' : 'Banco X',
            accountNumber: '------',
            description: payload.name
        }
        MOCK_BANK_ACCOUNTS.unshift(newAccount)
        return newAccount
    },

    update: async (id: string, payload: Partial<BankAccountPayload>): Promise<BankAccount> => {
        await delay()
        const idx = MOCK_BANK_ACCOUNTS.findIndex(a => a.id === id)
        if (idx === -1) throw new Error('Bank account not found')
        
        MOCK_BANK_ACCOUNTS[idx] = { ...MOCK_BANK_ACCOUNTS[idx], ...payload }
        return MOCK_BANK_ACCOUNTS[idx]
    },

    toggleStatus: async (id: string): Promise<BankAccount> => {
        await delay()
        const idx = MOCK_BANK_ACCOUNTS.findIndex(a => a.id === id)
        if (idx === -1) throw new Error('Bank account not found')

        MOCK_BANK_ACCOUNTS[idx] = { 
            ...MOCK_BANK_ACCOUNTS[idx], 
            isActive: !MOCK_BANK_ACCOUNTS[idx].isActive 
        }
        return MOCK_BANK_ACCOUNTS[idx]
    }
}
