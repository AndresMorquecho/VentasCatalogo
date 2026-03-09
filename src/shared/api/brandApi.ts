import type { Brand, CreateBrandPayload, UpdateBrandPayload } from '@/entities/brand/model/types';
import { httpClient } from '../lib/httpClient';
import type { PaginatedResponse } from '@/entities/order/model/types';

export const brandApi = {
    getAll: async (params?: { page?: number; limit?: number; includeInactive?: boolean; search?: string }): Promise<PaginatedResponse<Brand>> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.includeInactive !== undefined) queryParams.append('include_inactive', params.includeInactive.toString());
        else queryParams.append('include_inactive', 'true');

        return httpClient.get<PaginatedResponse<Brand>>(`/brands?${queryParams.toString()}`);
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
