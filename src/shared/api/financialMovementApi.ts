import type { FinancialMovement } from '@/entities/financial-movement/model/types';

const MOCK_MOVEMENTS: FinancialMovement[] = [];

const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const financialMovementApi = {
    getAll: async (): Promise<FinancialMovement[]> => {
        await delay();
        return [...MOCK_MOVEMENTS];
    },

    getById: async (id: string): Promise<FinancialMovement | undefined> => {
        await delay();
        return MOCK_MOVEMENTS.find(m => m.id === id);
    },

    create: async (movement: FinancialMovement): Promise<FinancialMovement> => {
        await delay();
        MOCK_MOVEMENTS.push(movement);
        return movement;
    },

    update: async (id: string, updates: Partial<FinancialMovement>): Promise<FinancialMovement> => {
        await delay();
        const index = MOCK_MOVEMENTS.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Financial Movement not found');

        MOCK_MOVEMENTS[index] = { ...MOCK_MOVEMENTS[index], ...updates };
        return MOCK_MOVEMENTS[index];
    },

    delete: async (id: string): Promise<void> => {
        await delay();
        const index = MOCK_MOVEMENTS.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Financial Movement not found');
        MOCK_MOVEMENTS.splice(index, 1);
    },

    /** Find movement by referenceId (e.g. OrderPayment ID) */
    getByReference: async (referenceId: string): Promise<FinancialMovement | undefined> => {
        await delay();
        return MOCK_MOVEMENTS.find(m => m.referenceId === referenceId);
    }
};
