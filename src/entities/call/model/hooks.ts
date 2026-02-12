import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { callApi } from './api'
import type { CallPayload } from './types'

const KEYS = {
    all: ['calls'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    byClient: (clientId: string) => [...KEYS.all, 'client', clientId] as const
}

export function useCallList() {
    return useQuery({ queryKey: KEYS.list(), queryFn: callApi.getAll })
}

export function useCallsByClient(clientId: string) {
    return useQuery({
        queryKey: KEYS.byClient(clientId),
        queryFn: () => callApi.getByClient(clientId),
        enabled: !!clientId
    })
}

export function useCreateCall() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: CallPayload) => callApi.create(data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: KEYS.byClient(v.clientId) })
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}

export function useUpdateCall() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CallPayload> }) => 
            callApi.update(id, data),
        onSuccess: (updatedCall) => {
            qc.invalidateQueries({ queryKey: KEYS.byClient(updatedCall.clientId) })
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}
