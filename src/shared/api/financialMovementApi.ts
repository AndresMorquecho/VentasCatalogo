import type { FinancialMovement } from '@/entities/financial-movement/model/types';

// Mock data for testing - Synced with orders from 2026-02-20
const MOCK_MOVEMENTS: FinancialMovement[] = [
    // REC-001: Abono inicial $100 EFECTIVO
    {
        id: 'mov-001',
        type: 'INCOME',
        source: 'ORDER_PAYMENT',
        amount: 100.00,
        description: 'Abono inicial pedido #REC-001',
        bankAccountId: '2',
        referenceId: 'pay-101-init',
        clientId: '1',
        clientName: 'Maria Fernanda Gonzalez',
        paymentMethod: 'EFECTIVO',
        createdBy: 'Vendedor',
        createdByName: 'Vendedor',
        createdAt: '2026-02-20T10:00:00.000Z'
    },
    // REC-005: Abono inicial $30 EFECTIVO
    {
        id: 'mov-002',
        type: 'INCOME',
        source: 'ORDER_PAYMENT',
        amount: 30.00,
        description: 'Abono inicial pedido #REC-005',
        bankAccountId: '2',
        referenceId: 'pay-105-init',
        clientId: '1',
        clientName: 'Maria Fernanda Gonzalez',
        paymentMethod: 'EFECTIVO',
        createdBy: 'Vendedor',
        createdByName: 'Vendedor',
        createdAt: '2026-02-20T11:00:00.000Z'
    },
    // REC-005: Abono posterior $65 TRANSFERENCIA
    {
        id: 'mov-003',
        type: 'INCOME',
        source: 'ORDER_PAYMENT',
        amount: 65.00,
        description: 'Abono posterior pedido #REC-005',
        bankAccountId: '1',
        referenceId: 'pay-105-add',
        clientId: '1',
        clientName: 'Maria Fernanda Gonzalez',
        paymentMethod: 'TRANSFERENCIA',
        createdBy: 'Vendedor',
        createdByName: 'Vendedor',
        createdAt: '2026-02-20T11:30:00.000Z'
    },
    // REC-002: Abono inicial $75.50 TRANSFERENCIA (día anterior)
    {
        id: 'mov-004',
        type: 'INCOME',
        source: 'ORDER_PAYMENT',
        amount: 75.50,
        description: 'Abono inicial pedido #REC-002',
        bankAccountId: '1',
        referenceId: 'pay-102-init',
        clientId: '2',
        clientName: 'Ana Lucia Perez',
        paymentMethod: 'TRANSFERENCIA',
        createdBy: 'Vendedor',
        createdByName: 'Vendedor',
        createdAt: '2026-02-19T14:30:00.000Z'
    },
    // REC-007: Abono inicial $45 EFECTIVO (día anterior)
    {
        id: 'mov-005',
        type: 'INCOME',
        source: 'ORDER_PAYMENT',
        amount: 45.00,
        description: 'Abono inicial pedido #REC-007',
        bankAccountId: '2',
        referenceId: 'pay-107-init',
        clientId: '2',
        clientName: 'Ana Lucia Perez',
        paymentMethod: 'EFECTIVO',
        createdBy: 'Vendedor',
        createdByName: 'Vendedor',
        createdAt: '2026-02-19T13:00:00.000Z'
    }
];

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
