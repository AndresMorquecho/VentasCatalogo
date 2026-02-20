// Application Layer - Financial Record Service
// Centralizes creation of both FinancialTransaction and FinancialMovement

import { transactionApi } from '@/shared/api/transactionApi';
import { financialMovementApi } from '@/shared/api/financialMovementApi';
import { createFinancialMovement } from '@/entities/financial-movement/model/model';
import type { FinancialTransactionType } from '@/entities/financial-transaction/model/types';
import type { FinancialMovementSource } from '@/entities/financial-movement/model/types';

export interface CreateFinancialRecordInput {
    // Transaction fields (for audit)
    type: FinancialTransactionType;
    referenceNumber: string;
    amount: number;
    date: string;
    clientId: string;
    orderId?: string;
    createdBy: string;
    notes?: string;
    
    // Movement fields (for cash closure)
    bankAccountId: string;
    source: FinancialMovementSource;
    clientName?: string;
    paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';
    createdByName?: string;
}

export interface FinancialRecordResult {
    transactionId: string;
    movementId: string;
}

/**
 * Creates both FinancialTransaction (audit) and FinancialMovement (cash closure)
 * This ensures all financial operations appear in both systems
 */
export const financialRecordService = {
    /**
     * Create a complete financial record
     */
    async createRecord(input: CreateFinancialRecordInput): Promise<FinancialRecordResult> {
        // 1. Create FinancialTransaction (for audit trail)
        const transaction = await transactionApi.createTransaction({
            type: input.type,
            referenceNumber: input.referenceNumber,
            amount: input.amount,
            date: input.date,
            clientId: input.clientId,
            clientName: input.clientName, // Add client name
            orderId: input.orderId,
            createdBy: input.createdBy,
            notes: input.notes
        });

        // 2. Create FinancialMovement (for cash closure)
        const movement = createFinancialMovement({
            type: 'INCOME', // All financial records are income for now
            source: input.source,
            amount: input.amount,
            bankAccountId: input.bankAccountId,
            referenceId: transaction.id, // Link to transaction
            description: input.notes || `${input.type} - ${input.referenceNumber}`,
            clientId: input.clientId,
            clientName: input.clientName,
            paymentMethod: input.paymentMethod,
            createdBy: input.createdBy,
            createdByName: input.createdByName
        });

        await financialMovementApi.create(movement);

        return {
            transactionId: transaction.id,
            movementId: movement.id
        };
    },

    /**
     * Create record for order payment
     */
    async createOrderPaymentRecord(
        orderId: string,
        orderReceiptNumber: string,
        amount: number,
        clientId: string,
        clientName: string,
        paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE',
        bankAccountId: string,
        referenceNumber: string,
        createdBy: string,
        createdByName?: string,
        isInitialPayment: boolean = false
    ): Promise<FinancialRecordResult> {
        const type: FinancialTransactionType = paymentMethod === 'EFECTIVO' ? 'EFECTIVO' : 
                                               paymentMethod === 'TRANSFERENCIA' ? 'TRANSFERENCIA' :
                                               paymentMethod === 'DEPOSITO' ? 'DEPOSITO' : 'CHEQUE';

        const notes = isInitialPayment 
            ? `Abono inicial pedido #${orderReceiptNumber}`
            : `Abono posterior pedido #${orderReceiptNumber}`;

        return this.createRecord({
            type,
            referenceNumber,
            amount,
            date: new Date().toISOString(),
            clientId,
            orderId,
            createdBy,
            notes,
            bankAccountId,
            source: 'ORDER_PAYMENT',
            clientName,
            paymentMethod,
            createdByName
        });
    },

    /**
     * Create record for adjustment (credit generation)
     */
    async createAdjustmentRecord(
        orderId: string,
        orderReceiptNumber: string,
        amount: number,
        clientId: string,
        clientName: string,
        bankAccountId: string,
        reason: string,
        createdBy: string,
        createdByName?: string
    ): Promise<FinancialRecordResult> {
        const referenceNumber = `AJUSTE-${orderReceiptNumber}-${Date.now()}`;

        return this.createRecord({
            type: 'AJUSTE',
            referenceNumber,
            amount,
            date: new Date().toISOString(),
            clientId,
            orderId,
            createdBy,
            notes: reason,
            bankAccountId,
            source: 'ADJUSTMENT',
            clientName,
            paymentMethod: 'EFECTIVO', // Adjustments default to cash
            createdByName
        });
    }
};
