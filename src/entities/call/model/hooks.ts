import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi, type CallQueryParams } from './api';
import type { CallPayload } from './types';

const KEYS = {
    all: ['calls'] as const,
    list: (params?: CallQueryParams) => [...KEYS.all, 'list', params] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const
};

export function useCalls(params?: CallQueryParams) {
    return useQuery({
        queryKey: KEYS.list(params),
        queryFn: () => callApi.getAll(params),
        placeholderData: (prev) => prev
    });
}

export function useCreateCall() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CallPayload) => callApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.all });
        }
    });
}

export function useUpdateCall() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CallPayload> }) =>
            callApi.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: KEYS.all });
            queryClient.invalidateQueries({ queryKey: KEYS.detail(data.id) });
        }
    });
}
export function useDeleteCall() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => callApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.all });
        }
    });
}
