import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addPayment, editPayment, removePayment } from '@/entities/order/model/model'
import { orderApi } from '@/entities/order/model/api'
import { bankAccountApi } from '@/entities/bank-account/model/api'
import { createFinancialMovement } from '@/entities/financial-movement/model/model'
import { financialMovementApi } from '@/entities/financial-movement/model/api'
import type { Order } from '@/entities/order/model/types'
import type { BankAccount } from '@/entities/bank-account/model/types'

export const useAddOrderPayment = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ order, amount, bankAccount }: { order: Order; amount: number; bankAccount: BankAccount }) => {
            const { updatedOrder, updatedBankAccount, newPayment } = addPayment(order, { amount }, bankAccount)
            
            const movement = createFinancialMovement({
                type: 'INCOME',
                source: 'ORDER_PAYMENT',
                amount: amount,
                bankAccountId: bankAccount.id,
                referenceId: newPayment.id,
                description: `Abono Pedido #${order.receiptNumber}`
            })

            await Promise.all([
                orderApi.update(updatedOrder.id, updatedOrder),
                bankAccountApi.update(updatedBankAccount.id, { currentBalance: updatedBankAccount.currentBalance }),
                financialMovementApi.create(movement)
            ])
            return updatedOrder
        },
        onSuccess: () => {
             qc.invalidateQueries({ queryKey: ['orders'] })
             qc.invalidateQueries({ queryKey: ['bank-accounts'] })
        }
    })
}

export const useEditOrderPayment = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ 
            order, 
            paymentId, 
            newAmount, 
            bankAccount 
        }: { 
            order: Order; 
            paymentId: string; 
            newAmount: number; 
            bankAccount: BankAccount 
        }) => {
            const { updatedOrder, updatedBankAccount } = editPayment(order, paymentId, newAmount, bankAccount)

            const movement = await financialMovementApi.getByReference(paymentId)
            
            const promises: Promise<any>[] = [
                orderApi.update(updatedOrder.id, updatedOrder),
                bankAccountApi.update(updatedBankAccount.id, { currentBalance: updatedBankAccount.currentBalance })
            ]

            if (movement) {
                promises.push(financialMovementApi.update(movement.id, { amount: newAmount }))
            }

            await Promise.all(promises)
            return updatedOrder
        },
        onSuccess: () => {
             qc.invalidateQueries({ queryKey: ['orders'] })
             qc.invalidateQueries({ queryKey: ['bank-accounts'] })
        }
    })
}

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
            const { updatedOrder, updatedBankAccount } = removePayment(order, paymentId, bankAccount)
            
            const movement = await financialMovementApi.getByReference(paymentId)

            const promises: Promise<any>[] = [
                orderApi.update(updatedOrder.id, updatedOrder),
                bankAccountApi.update(updatedBankAccount.id, { currentBalance: updatedBankAccount.currentBalance })
            ]

            if (movement) {
                promises.push(financialMovementApi.delete(movement.id))
            }

            await Promise.all(promises)
            return updatedOrder
        },
        onSuccess: () => {
             qc.invalidateQueries({ queryKey: ['orders'] })
             qc.invalidateQueries({ queryKey: ['bank-accounts'] })
        }
    })
}
