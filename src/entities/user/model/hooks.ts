import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userApi } from './api'
import type { UserPayload } from './types'

const KEYS = {
    all: ['users'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

export function useUserList() {
    return useQuery({
        queryKey: KEYS.list(),
        queryFn: userApi.getAll,
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
            queryClient.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}

export function useUpdateUser() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<UserPayload> }) => 
            userApi.update(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: KEYS.list() })
            queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
        }
    })
}
