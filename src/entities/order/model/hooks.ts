import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderApi } from './api'
import type { OrderPayload } from './types'

const KEYS = {
    all: ['orders'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
    byClient: (clientId: string) => [...KEYS.all, 'client', clientId] as const,
}

export function useOrderList() {
    return useQuery({ queryKey: KEYS.list(), queryFn: orderApi.getAll })
}

export function useOrder(id: string) {
    return useQuery({ queryKey: KEYS.detail(id), queryFn: () => orderApi.getById(id), enabled: !!id })
}

export function useOrdersByClient(clientId: string) {
    return useQuery({
        queryKey: KEYS.byClient(clientId),
        queryFn: () => orderApi.getByClient(clientId),
        enabled: !!clientId
    })
}

export function useCreateOrder() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: OrderPayload) => orderApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}

export function useUpdateOrder() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<OrderPayload> }) => orderApi.update(id, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: KEYS.list() })
            qc.invalidateQueries({ queryKey: KEYS.detail(id) })
        }
    })
}
