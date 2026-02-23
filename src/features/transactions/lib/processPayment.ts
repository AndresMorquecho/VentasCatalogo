import { validateTransaction } from "./validateTransaction";
import { clientCreditApi } from "@/shared/api/clientCreditApi";
import { financialRecordService } from "@/application/financial/financialRecord.service";
import type { FinancialRecordType } from "@/entities/financial-record/model/types";

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
 * Creates FinancialRecord for audit and cash closure
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
            const record = await financialRecordService.createOrderPaymentRecord(
                '', // orderId - will be set later
                `CASH-${Date.now()}`, // orderReceiptNumber
                input.amount,
                input.clientId,
                input.clientName || 'Cliente',
                'EFECTIVO',
                bankAccountId,
                input.user,
                'Pago en efectivo'
            );

            // Handle credit if overpayment
            let creditGenerated = 0;
            if (input.amount > input.currentPendingBalance + 0.001) {
                const excess = input.amount - input.currentPendingBalance;
                await clientCreditApi.createCredit({
                    clientId: input.clientId,
                    amount: excess,
                    originTransactionId: record.id
                });
                creditGenerated = excess;
            }

            return { transactionId: record.id, creditGenerated };
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
        type: 'PAYMENT' as FinancialRecordType,
        source: 'ORDER_PAYMENT' as const,
        movementType: 'INCOME' as const,
        referenceNumber: input.reference,
        amount: input.amount,
        date: input.date,
        clientId: input.clientId,
        clientName: input.clientName || 'Cliente',
        createdBy: input.user,
        bankAccountId,
        paymentMethod: input.method as 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE'
    };

    await validateTransaction(txData); 
    
    // 3. Create Financial Record
    const record = await financialRecordService.createOrderPaymentRecord(
        '', // orderId - will be set later
        input.reference,
        input.amount,
        input.clientId,
        input.clientName || 'Cliente',
        input.method as 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE',
        bankAccountId,
        input.user,
        `Pago con ${input.method}`
    );

    // 4. Handle Credit Logic (Overpayment)
    let creditGenerated = 0;
    if (input.amount > input.currentPendingBalance + 0.001) {
        const excess = input.amount - input.currentPendingBalance;
        await clientCreditApi.createCredit({
            clientId: input.clientId,
            amount: excess,
            originTransactionId: record.id
        });
        creditGenerated = excess;
    }

    return { transactionId: record.id, creditGenerated };
};
