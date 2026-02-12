import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveryApi } from './api'
import type { DeliveryPayload } from './types'

const KEYS = {
    all: ['deliveries'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    byOrder: (pid: string) => [...KEYS.all, 'order', pid] as const,
}

export function useDeliveriesByOrder(orderId: string) {
    return useQuery({
        queryKey: KEYS.byOrder(orderId),
        queryFn: () => deliveryApi.getByOrder(orderId),
        enabled: !!orderId,
    })
}

export function useCreateDelivery() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: DeliveryPayload) => deliveryApi.create(data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: KEYS.byOrder(v.orderId) })
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}

export function useUpdateDelivery() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DeliveryPayload> }) => 
            deliveryApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}
