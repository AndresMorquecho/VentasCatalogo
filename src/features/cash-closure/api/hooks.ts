import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashClosureApi } from '@/shared/api/cashClosureApi';
import type { CreateCashClosurePayload } from '@/entities/cash-closure/model/types';

export const CASH_CLOSURE_QUERY_KEYS = {
    all: ['cash-closures'] as const,
    list: () => [...CASH_CLOSURE_QUERY_KEYS.all, 'list'] as const,
    detail: (id: string) => [...CASH_CLOSURE_QUERY_KEYS.all, 'detail', id] as const,
};

export function useCashClosures(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: [...CASH_CLOSURE_QUERY_KEYS.list(), params],
        queryFn: () => cashClosureApi.getAll(params?.page, params?.limit),
    });
}


export function useCashClosure(id: string) {
    return useQuery({
        queryKey: CASH_CLOSURE_QUERY_KEYS.detail(id),
        queryFn: () => cashClosureApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateCashClosure() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateCashClosurePayload) => cashClosureApi.create(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CASH_CLOSURE_QUERY_KEYS.list() });
        },
    });
}

export function useDeleteCashClosure() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => cashClosureApi.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CASH_CLOSURE_QUERY_KEYS.list() });
        },
    });
}

export function useCashClosurePreview(toDate?: string) {
    return useQuery({
        queryKey: [...CASH_CLOSURE_QUERY_KEYS.all, 'preview', toDate],
        queryFn: () => cashClosureApi.getPreview(toDate),
    });
}
