import type { Brand, BrandPayload } from './types'

const MOCK_BRANDS: Brand[] = [
    { 
        id: '1', 
        name: 'SHEIN', 
        description: 'Clothing giant', 
        isActive: true, 
        createdAt: '2025-01-01T10:00:00Z' 
    },
    { 
        id: '2', 
        name: 'Nike', 
        description: 'Sportswear', 
        isActive: true, 
        createdAt: '2025-01-02T11:00:00Z' 
    },
    { 
        id: '3', 
        name: 'Adidas', 
        isActive: false, 
        createdAt: '2025-01-03T12:00:00Z' 
    }
]

const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

export const brandApi = {
    getAll: async (): Promise<Brand[]> => {
        await delay()
        return [...MOCK_BRANDS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    
    getById: async (id: string): Promise<Brand | undefined> => {
        await delay()
        return MOCK_BRANDS.find(m => m.id === id)
    },
    
    create: async (data: BrandPayload): Promise<Brand> => {
        await delay()
        const newItem: Brand = { 
            id: String(Date.now()), 
            ...data, 
            createdAt: new Date().toISOString() 
        }
        MOCK_BRANDS.unshift(newItem)
        return newItem
    },
    
    update: async (id: string, data: Partial<BrandPayload>): Promise<Brand> => {
        await delay()
        const idx = MOCK_BRANDS.findIndex(m => m.id === id)
        if (idx === -1) throw new Error('Brand not found')
        
        MOCK_BRANDS[idx] = { ...MOCK_BRANDS[idx], ...data }
        return MOCK_BRANDS[idx]
    },

    toggleStatus: async (id: string): Promise<Brand> => {
        await delay()
        const idx = MOCK_BRANDS.findIndex(m => m.id === id)
        if (idx === -1) throw new Error('Brand not found')
        
        MOCK_BRANDS[idx] = { 
            ...MOCK_BRANDS[idx], 
            isActive: !MOCK_BRANDS[idx].isActive 
        }
        return MOCK_BRANDS[idx]
    }
}
