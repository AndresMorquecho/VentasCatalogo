import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from './api';
import type { CallPayload } from './types';

const KEYS = {
    all: ['calls'] as const,
    list: (clientId?: string) => [...KEYS.all, 'list', { clientId }] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const
};

export function useCalls(clientId?: string) {
    return useQuery({
        queryKey: KEYS.list(clientId),
        queryFn: () => callApi.getAll(clientId)
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
