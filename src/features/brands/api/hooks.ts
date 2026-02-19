import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandApi } from '@/shared/api/brandApi';
import type { CreateBrandPayload, UpdateBrandPayload } from '@/entities/brand/model/types';

export const BRAND_QUERY_KEYS = {
    all: ['brands'] as const,
    list: () => [...BRAND_QUERY_KEYS.all, 'list'] as const,
    detail: (id: string) => [...BRAND_QUERY_KEYS.all, 'detail', id] as const,
};

export function useBrandList() {
    return useQuery({
        queryKey: BRAND_QUERY_KEYS.list(),
        queryFn: brandApi.getAll,
    });
}

export function useBrand(id: string) {
    return useQuery({
        queryKey: BRAND_QUERY_KEYS.detail(id),
        queryFn: () => brandApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateBrand() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBrandPayload) => brandApi.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.list() }),
    });
}

export function useUpdateBrand() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBrandPayload }) =>
            brandApi.update(id, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.list() });
            qc.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.detail(id) });
        },
    });
}

export function useDeleteBrand() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => brandApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.list() }),
    });
}

export function useToggleBrandStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => brandApi.toggleStatus(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.list() });
            qc.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.detail(id) });
        },
    });
}
