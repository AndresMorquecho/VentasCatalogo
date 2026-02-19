import type { Client, ClientPayload } from '@/entities/client/model/types';
import { orderApi } from '@/entities/order/model/api';

const MOCK_CLIENTS: Client[] = [
    {
        id: '1',
        identificationType: 'CEDULA',
        identificationNumber: '1723456789',
        firstName: 'Maria Fernanda Gonzalez',
        country: 'Ecuador',
        province: 'Pichincha',
        branch: 'MATRIZ',
        city: 'Quito',
        address: 'Av. Amazonas y Colon N23-45',
        neighborhood: 'La Mariscal',
        sector: 'Norte',
        email: 'maria.gonzalez@email.com',
        reference: 'Frente al parque El Ejido',
        phone1: '0998765432',
        operator1: 'Claro',
        phone2: '0987654321',
        operator2: 'Movistar',
        createdAt: '2024-05-15T10:00:00Z',
    },
    {
        id: '2',
        identificationType: 'CEDULA',
        identificationNumber: '1712345678',
        firstName: 'Ana Lucia Perez',
        country: 'Ecuador',
        province: 'Guayas',
        branch: 'MATRIZ',
        city: 'Guayaquil',
        address: 'Calle 10 de Agosto 456',
        email: 'ana.perez@email.com',
        phone1: '0987654321',
        operator1: 'Movistar',
        createdAt: '2025-01-20T14:00:00Z',
    },
];

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const clientApi = {
    getAll: async (): Promise<Client[]> => {
        await delay();
        return [...MOCK_CLIENTS];
    },

    getById: async (id: string): Promise<Client | undefined> => {
        await delay();
        return MOCK_CLIENTS.find(c => c.id === id);
    },

    create: async (payload: ClientPayload): Promise<Client> => {
        await delay(600);
        const newClient: Client = {
            id: String(Date.now()),
            ...payload,
            createdAt: new Date().toISOString(),
        };
        MOCK_CLIENTS.push(newClient);
        return newClient;
    },

    update: async (id: string, payload: Partial<ClientPayload>): Promise<Client> => {
        await delay(500);
        const index = MOCK_CLIENTS.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Client not found');

        const updated = { ...MOCK_CLIENTS[index], ...payload };
        MOCK_CLIENTS[index] = updated;

        // Sync clientName in all related orders (denormalized field consistency)
        // In a real backend this would be handled server-side.
        if (payload.firstName) {
            await orderApi.syncClientName(id, payload.firstName);
        }

        return updated;
    },

    delete: async (id: string): Promise<void> => {
        await delay(400);
        const index = MOCK_CLIENTS.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Client not found');
        MOCK_CLIENTS.splice(index, 1);
    },
};
