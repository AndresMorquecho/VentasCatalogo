import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bankAccountApi } from './api'
import type { BankAccountPayload } from './types'

const KEYS = {
    all: ['bank-accounts'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

export function useBankAccountList() {
    return useQuery({
        queryKey: KEYS.list(),
        queryFn: bankAccountApi.getAll
    })
}

export function useCreateBankAccount() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: BankAccountPayload) => bankAccountApi.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list() })
    })
}

export function useUpdateBankAccount() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BankAccountPayload> }) => 
            bankAccountApi.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list() })
    })
}

export function useToggleBankAccountStatus() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => bankAccountApi.toggleStatus(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list() })
    })
}
