import type { Brand, CreateBrandPayload, UpdateBrandPayload } from '@/entities/brand/model/types';
import { httpClient } from '../lib/httpClient';

export const brandApi = {
    getAll: async (): Promise<Brand[]> => {
        return httpClient.get<Brand[]>('/brands');
    },

    getById: async (id: string): Promise<Brand | undefined> => {
        try {
            return await httpClient.get<Brand>(`/brands/${id}`);
        } catch {
            return undefined;
        }
    },

    create: async (data: CreateBrandPayload): Promise<Brand> => {
        return httpClient.post<Brand>('/brands', data);
    },

    update: async (id: string, data: UpdateBrandPayload): Promise<Brand> => {
        return httpClient.put<Brand>(`/brands/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        await httpClient.delete<void>(`/brands/${id}`);
    },

    toggleStatus: async (id: string): Promise<Brand> => {
        // Get current brand
        const brand = await httpClient.get<Brand>(`/brands/${id}`);
        // Toggle status
        return httpClient.put<Brand>(`/brands/${id}`, {
            isActive: !brand.isActive
        });
    }
};
