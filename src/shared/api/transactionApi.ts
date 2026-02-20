import type { FinancialTransaction } from "@/entities/financial-transaction/model/types";
import type { ClientCredit } from "@/entities/client-credit/model/types";

// Mock Store - Persistence in memory with initial test data
export type FinancialTransactionPayload = Omit<FinancialTransaction, 'id' | 'createdAt'>;

const MOCK_TRANSACTIONS: FinancialTransaction[] = [
    // REC-001: Abono inicial $100 EFECTIVO
    {
        id: 'tx-001',
        type: 'EFECTIVO',
        referenceNumber: 'EFECTIVO-pay-101-init',
        amount: 100.00,
        date: '2026-02-20T10:00:00.000Z',
        clientId: '1',
        orderId: '101',
        createdBy: 'Vendedor',
        notes: 'Abono inicial pedido #REC-001',
        createdAt: '2026-02-20T10:00:00.000Z'
    },
    // REC-005: Abono inicial $30 EFECTIVO
    {
        id: 'tx-002',
        type: 'EFECTIVO',
        referenceNumber: 'EFECTIVO-pay-105-init',
        amount: 30.00,
        date: '2026-02-20T11:00:00.000Z',
        clientId: '1',
        orderId: '105',
        createdBy: 'Vendedor',
        notes: 'Abono inicial pedido #REC-005',
        createdAt: '2026-02-20T11:00:00.000Z'
    },
    // REC-005: Abono posterior $65 TRANSFERENCIA
    {
        id: 'tx-003',
        type: 'TRANSFERENCIA',
        referenceNumber: '123',
        amount: 65.00,
        date: '2026-02-20T11:30:00.000Z',
        clientId: '1',
        orderId: '105',
        createdBy: 'Vendedor',
        notes: 'Abono posterior pedido #REC-005',
        createdAt: '2026-02-20T11:30:00.000Z'
    },
    // REC-002: Abono inicial $75.50 TRANSFERENCIA (día anterior)
    {
        id: 'tx-004',
        type: 'TRANSFERENCIA',
        referenceNumber: 'TRANS-pay-102-init',
        amount: 75.50,
        date: '2026-02-19T14:30:00.000Z',
        clientId: '2',
        orderId: '102',
        createdBy: 'Vendedor',
        notes: 'Abono inicial pedido #REC-002',
        createdAt: '2026-02-19T14:30:00.000Z'
    },
    // REC-007: Abono inicial $45 EFECTIVO (día anterior)
    {
        id: 'tx-005',
        type: 'EFECTIVO',
        referenceNumber: 'EFECTIVO-pay-107-init',
        amount: 45.00,
        date: '2026-02-19T13:00:00.000Z',
        clientId: '2',
        orderId: '107',
        createdBy: 'Vendedor',
        notes: 'Abono inicial pedido #REC-007',
        createdAt: '2026-02-19T13:00:00.000Z'
    }
];
const MOCK_CREDITS: ClientCredit[] = [];

// Helper
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const transactionApi = {
    getAll: async (filters?: {
        startDate?: string;
        endDate?: string;
        referenceNumber?: string;
        clientId?: string;
    }): Promise<FinancialTransaction[]> => {
        await delay();
        let result = [...MOCK_TRANSACTIONS];

        if (filters?.startDate) {
            result = result.filter(t => t.date >= filters.startDate!);
        }
        if (filters?.endDate) {
            result = result.filter(t => t.date <= filters.endDate!);
        }
        if (filters?.referenceNumber) {
            const lowerRef = filters.referenceNumber.toLowerCase();
            result = result.filter(t => t.referenceNumber.toLowerCase().includes(lowerRef));
        }
        if (filters?.clientId) {
            result = result.filter(t => t.clientId === filters.clientId);
        }

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    findByReference: async (referenceNumber: string): Promise<FinancialTransaction | undefined> => {
        await delay();
        return MOCK_TRANSACTIONS.find(
            t => t.referenceNumber.toLowerCase() === referenceNumber.toLowerCase()
        );
    },

    createTransaction: async (data: Omit<FinancialTransaction, 'id' | 'createdAt'>): Promise<FinancialTransaction> => {
        await delay();
        
        // Simulate DB unique constraint
        const exists = MOCK_TRANSACTIONS.some(t => t.referenceNumber.toLowerCase() === data.referenceNumber.toLowerCase());
        if (exists) {
            throw new Error(`La transacción con referencia ${data.referenceNumber} ya existe.`);
        }

        const newTx: FinancialTransaction = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            ...data
        };

        MOCK_TRANSACTIONS.push(newTx);
        return newTx;
    }
};

export const clientCreditApi = {
    getByClient: async (clientId: string): Promise<ClientCredit[]> => {
        await delay();
        return MOCK_CREDITS.filter(c => c.clientId === clientId);
    },

    createCredit: async (data: Omit<ClientCredit, 'id' | 'createdAt'>): Promise<ClientCredit> => {
        await delay();
        
        // TODO BACKEND: Validate no duplicate credit for same originTransactionId
        // Prevent duplicate credit generation
        const existingCredit = MOCK_CREDITS.find(c => c.originTransactionId === data.originTransactionId);
        if (existingCredit) {
            console.warn(`Credit already exists for transaction ${data.originTransactionId}, skipping creation`);
            return existingCredit; // Return existing instead of creating duplicate
        }
        
        const newCredit: ClientCredit = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            ...data
        };
        MOCK_CREDITS.push(newCredit);
        return newCredit;
    },

    useCredit: async (creditId: string, amountToUse: number): Promise<void> => {
        await delay();
        const idx = MOCK_CREDITS.findIndex(c => c.id === creditId);
        if (idx === -1) throw new Error("Crédito no encontrado");

        const credit = MOCK_CREDITS[idx];
        if (credit.amount < amountToUse) throw new Error("Saldo insuficiente en crédito");

        credit.amount -= amountToUse;
        
        // If close to 0, delete
        if (credit.amount < 0.01) {
            MOCK_CREDITS.splice(idx, 1);
        } else {
            MOCK_CREDITS[idx] = credit; // Update ref
        }
    }
};
