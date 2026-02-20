import type { CashClosure, CreateCashClosurePayload } from '@/entities/cash-closure/model/types';

const MOCK_CLOSURES: CashClosure[] = [];

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const cashClosureApi = {
    getAll: async (): Promise<CashClosure[]> => {
        await delay();
        // Return sorted by closedAt descending by default
        return [...MOCK_CLOSURES].sort(
            (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
        );
    },

    getById: async (id: string): Promise<CashClosure | undefined> => {
        await delay();
        return MOCK_CLOSURES.find(c => c.id === id);
    },

    create: async (payload: CreateCashClosurePayload): Promise<CashClosure> => {
        await delay();
        const newClosure: CashClosure = {
            id: crypto.randomUUID(),
            ...payload,
            closedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        MOCK_CLOSURES.unshift(newClosure);
        return newClosure;
    },

    delete: async (id: string): Promise<void> => {
        await delay();
        const index = MOCK_CLOSURES.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Cierre de caja no encontrado');
        MOCK_CLOSURES.splice(index, 1);
    }
};
