import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientApi } from './api'
import type { ClientPayload } from './types'

const KEYS = {
    all: ['clients'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

export function useClientList() {
    return useQuery({
        queryKey: KEYS.list(),
        queryFn: clientApi.getAll,
    })
}

export function useClient(id: string) {
    return useQuery({
        queryKey: KEYS.detail(id),
        queryFn: () => clientApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateClient() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: ClientPayload) => clientApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}

export function useUpdateClient() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ClientPayload> }) => 
            clientApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
            queryClient.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}
