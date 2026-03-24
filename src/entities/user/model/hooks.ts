import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userApi } from './api'
import type { UserPayload } from './types'

const KEYS = {
    all: ['users'] as const,
    list: (params?: any) => [...KEYS.all, 'list', params] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

export function useUsers(params?: { search?: string; limit?: number; page?: number }) {
    return useQuery({
        queryKey: KEYS.list(params),
        queryFn: () => userApi.getAll(params),
        placeholderData: (prev) => prev
    })
}

export function useUserList() {
    return useQuery({
        queryKey: KEYS.list(),
        queryFn: () => userApi.getAll(),
    })
}

export function useUser(id: string) {
    return useQuery({
        queryKey: KEYS.detail(id),
        queryFn: () => userApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateUser() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (payload: UserPayload) => userApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.all })
        }
    })
}

export function useUpdateUser() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<UserPayload> }) => 
            userApi.update(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: KEYS.all })
            queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
        }
    })
}
