import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bankAccountApi } from '@/shared/api/bankAccountApi'
import type { BankAccount, BankAccountPayload } from '@/entities/bank-account/model/types'
import type { PaginatedResponse } from '@/entities/order/model/types'

const KEYS = {
    all: ['bank-accounts'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

export function useBankAccountList(params?: { page?: number; limit?: number }) {
    return useQuery<PaginatedResponse<BankAccount>>({
        queryKey: [...KEYS.list(), params],
        queryFn: () => bankAccountApi.getAll(params),
        placeholderData: (prev) => prev
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

export function useDeleteBankAccount() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => bankAccountApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list() })
    })
}
