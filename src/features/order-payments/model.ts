import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Order } from '@/entities/order/model/types'
import type { BankAccount } from '@/entities/bank-account/model/types'
import { orderPaymentApi } from '@/shared/api/orderPaymentApi'

/**
 * Invalidates all financial caches after any payment operation.
 */
function invalidateFinancialCaches(qc: ReturnType<typeof useQueryClient>) {
    qc.invalidateQueries({ queryKey: ['orders'] })
    qc.invalidateQueries({ queryKey: ['bank-accounts'] })
    qc.invalidateQueries({ queryKey: ['financial-records'] })
}

/**
 * ADDS a payment to an order.
 * Delegates transactional logic to shared API.
 */
export const useAddOrderPayment = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ order, amount, bankAccount, method, creditAmount }: { order: Order; amount: number; bankAccount?: BankAccount; method?: string; creditAmount?: number }) => {
            return orderPaymentApi.addOrderPaymentTransactional({ order, amount, bankAccount, method, creditAmount });
        },
        onSuccess: () => invalidateFinancialCaches(qc)
    })
}

/**
 * EDITS a payment in an order.
 * Delegates transactional logic to shared API.
 */
export const useEditOrderPayment = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            order,
            paymentId,
            newAmount,
            bankAccount,
            method
        }: {
            order: Order;
            paymentId: string;
            newAmount: number;
            bankAccount?: BankAccount;
            method?: string
        }) => {
            return orderPaymentApi.editOrderPaymentTransactional({ order, paymentId, newAmount, bankAccount, method });
        },
        onSuccess: () => invalidateFinancialCaches(qc)
    })
}

/**
 * REMOVES a payment from an order.
 * Delegates transactional logic to shared API.
 */
export const useRemoveOrderPayment = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            order,
            paymentId,
            bankAccount
        }: {
            order: Order;
            paymentId: string;
            bankAccount: BankAccount
        }) => {
            return orderPaymentApi.removeOrderPaymentTransactional({ order, paymentId, bankAccount });
        },
        onSuccess: () => invalidateFinancialCaches(qc)
    })
}
