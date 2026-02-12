import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { brandApi } from './api'
import type { BrandPayload } from './types'

const KEYS = {
    all: ['brands'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

export function useBrandList() {
    return useQuery({ 
        queryKey: KEYS.list(), 
        queryFn: brandApi.getAll 
    })
}

export function useBrand(id: string) {
    return useQuery({
        queryKey: KEYS.detail(id),
        queryFn: () => brandApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateBrand() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: BrandPayload) => brandApi.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list() })
    })
}

export function useUpdateBrand() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BrandPayload> }) => 
            brandApi.update(id, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: KEYS.list() })
            qc.invalidateQueries({ queryKey: KEYS.detail(id) })
        }
    })
}

export function useToggleBrandStatus() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => brandApi.toggleStatus(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: KEYS.list() })
            qc.invalidateQueries({ queryKey: KEYS.detail(id) })
        }
    })
}
