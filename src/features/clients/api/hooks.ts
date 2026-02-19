import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '@/shared/api/clientApi';
import type { ClientPayload } from '@/entities/client/model/types';

export const CLIENT_QUERY_KEYS = {
    all: ['clients'] as const,
    list: () => [...CLIENT_QUERY_KEYS.all, 'list'] as const,
    detail: (id: string) => [...CLIENT_QUERY_KEYS.all, 'detail', id] as const,
};

export function useClientList() {
    return useQuery({
        queryKey: CLIENT_QUERY_KEYS.list(),
        queryFn: clientApi.getAll,
    });
}

export function useClient(id: string) {
    return useQuery({
        queryKey: CLIENT_QUERY_KEYS.detail(id),
        queryFn: () => clientApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ClientPayload) => clientApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENT_QUERY_KEYS.list() });
        },
    });
}

export function useUpdateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ClientPayload> }) =>
            clientApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: CLIENT_QUERY_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: CLIENT_QUERY_KEYS.list() });
            // Also invalidate orders so the synced clientName is reflected
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

export function useDeleteClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => clientApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENT_QUERY_KEYS.list() });
        },
    });
}
