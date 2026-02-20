import { validateTransaction } from "./validateTransaction";
import { transactionApi, clientCreditApi } from "@/shared/api/transactionApi";
import { financialRecordService } from "@/application/financial/financialRecord.service";
import type { FinancialTransactionType } from "@/entities/financial-transaction/model/types";

interface PaymentInput {
    amount: number;
    method: string;
    reference?: string;
    clientId: string;
    clientName?: string;
    currentPendingBalance: number; 
    date: string;
    user: string;
    bankAccountId?: string; // Optional for backward compatibility
}

/**
 * Process Payment Registration with Transaction Validation
 * Creates both FinancialTransaction (audit) and FinancialMovement (cash closure)
 * 
 * @deprecated Consider using financialRecordService directly for new code
 */
export const processPaymentRegistration = async (input: PaymentInput) => {
    // 1. Is financial?
    const isFinancial = ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'].includes(input.method);
    
    // Get bank account ID (required for financial movement)
    // If not provided, try to get default cash account
    let bankAccountId = input.bankAccountId;
    if (!bankAccountId) {
        // For backward compatibility, use a default
        // In production, this should be required
        console.warn('[processPaymentRegistration] bankAccountId not provided, using default');
        bankAccountId = 'default-cash-account'; // This should be fetched from bankAccountApi
    }

    if (!isFinancial) {
        // Cash validation
        if (input.amount < 0) throw new Error("Monto inválido");
        
        // Create financial record for cash too
        try {
            const record = await financialRecordService.createRecord({
                type: 'EFECTIVO',
                referenceNumber: `EFECTIVO-${Date.now()}`,
                amount: input.amount,
                date: input.date,
                clientId: input.clientId,
                createdBy: input.user,
                notes: 'Pago en efectivo',
                bankAccountId,
                source: 'MANUAL',
                clientName: input.clientName,
                paymentMethod: 'EFECTIVO',
                createdByName: input.user
            });

            // Handle credit if overpayment
            let creditGenerated = 0;
            if (input.amount > input.currentPendingBalance + 0.001) {
                const excess = input.amount - input.currentPendingBalance;
                await clientCreditApi.createCredit({
                    clientId: input.clientId,
                    amount: excess,
                    originTransactionId: record.transactionId
                });
                creditGenerated = excess;
            }

            return { transactionId: record.transactionId, creditGenerated };
        } catch (error) {
            console.error('[processPaymentRegistration] Error creating financial record:', error);
            return { transactionId: null, creditGenerated: 0 };
        }
    }

    // 2. Validate Reference
    if (!input.reference || input.reference.trim() === "") {
        throw new Error(`Referencia obligatoria para pago con ${input.method}`);
    }
    
    // Check uniqueness & integrity
    const txData = {
        type: input.method as FinancialTransactionType,
        referenceNumber: input.reference,
        amount: input.amount,
        date: input.date,
        clientId: input.clientId,
        createdBy: input.user,
        notes: `Pago con ${input.method}`
    };

    await validateTransaction(txData); 
    
    // 3. Create Financial Record (Transaction + Movement)
    const record = await financialRecordService.createRecord({
        ...txData,
        bankAccountId,
        source: 'MANUAL',
        clientName: input.clientName,
        paymentMethod: input.method as 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE',
        createdByName: input.user
    });

    // 4. Handle Credit Logic (Overpayment)
    let creditGenerated = 0;
    if (input.amount > input.currentPendingBalance + 0.001) {
        const excess = input.amount - input.currentPendingBalance;
        await clientCreditApi.createCredit({
            clientId: input.clientId,
            amount: excess,
            originTransactionId: record.transactionId
        });
        creditGenerated = excess;
    }

    return { transactionId: record.transactionId, creditGenerated };
};
