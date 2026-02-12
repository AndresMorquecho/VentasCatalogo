import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { depositApi } from './api'
import type { DepositPayload } from './types'

const KEYS = {
    all: ['deposits'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    byClient: (clientId: string) => [...KEYS.all, 'client', clientId] as const,
}

export function useDepositList() {
    return useQuery({ queryKey: KEYS.list(), queryFn: depositApi.getAll })
}

export function useDepositsByClient(clientId: string) {
    return useQuery({
        queryKey: KEYS.byClient(clientId),
        queryFn: () => depositApi.getByClient(clientId),
        enabled: !!clientId,
    })
}

export function useCreateDeposit() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: DepositPayload) => depositApi.create(data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: KEYS.byClient(v.clientId) })
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}

export function useUpdateDeposit() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DepositPayload> }) => 
            depositApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}
