import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentApi } from './api'
import type { PaymentPayload } from './types'

const KEYS = {
    all: ['payments'] as const,
    list: () => [...KEYS.all, 'list'] as const,
    byOrder: (pid: string) => [...KEYS.all, 'order', pid] as const,
}

export function usePaymentsByOrder(orderId: string) {
    return useQuery({
        queryKey: KEYS.byOrder(orderId),
        queryFn: () => paymentApi.getByOrder(orderId),
        enabled: !!orderId,
    })
}

export function useCreatePayment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: PaymentPayload) => paymentApi.create(data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: KEYS.byOrder(variables.orderId) })
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}

export function useUpdatePayment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PaymentPayload> }) => 
            paymentApi.update(id, data),
        onSuccess: (updatedPayment) => {
            qc.invalidateQueries({ queryKey: KEYS.byOrder(updatedPayment.orderId) })
            qc.invalidateQueries({ queryKey: KEYS.list() })
        }
    })
}
