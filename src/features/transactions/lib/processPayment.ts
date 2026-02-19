import { validateTransaction } from "./validateTransaction";
import { transactionApi, clientCreditApi } from "@/shared/api/transactionApi";
import type { FinancialTransactionType } from "@/entities/financial-transaction/model/types";

interface PaymentInput {
    amount: number;
    method: string;
    reference?: string;
    clientId: string;
    currentPendingBalance: number; 
    date: string;
    user: string;
}

export const processPaymentRegistration = async (input: PaymentInput) => {
    // 1. Is financial?
    const isFinancial = ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'].includes(input.method);
    
    if (!isFinancial) {
        // Cash validation
        if (input.amount < 0) throw new Error("Monto inválido");
        return { transactionId: null, creditGenerated: 0 };
    }

    // 2. Validate Reference
    if (!input.reference || input.reference.trim() === "") {
        throw new Error(`Referencia obligatoria para pago con ${input.method}`);
    }
    
    // Check uniqueness & integrity
    // Create payload for validation
    const txData = {
        type: input.method as FinancialTransactionType,
        referenceNumber: input.reference,
        amount: input.amount,
        date: input.date,
        clientId: input.clientId,
        createdBy: input.user,
        notes: `Pago a pedido` // generic note
    };

    await validateTransaction(txData); 
    
    // 3. Create Transaction Record
    const tx = await transactionApi.createTransaction(txData);

    // 4. Handle Credit Logic (Overpayment)
    let creditGenerated = 0;
    // Tolerance for floating point
    if (input.amount > input.currentPendingBalance + 0.001) {
        const excess = input.amount - input.currentPendingBalance;
        // Register Credit
        await clientCreditApi.createCredit({
            clientId: input.clientId,
            amount: excess,
            originTransactionId: tx.id
        });
        creditGenerated = excess;
    }

    return { transactionId: tx.id, creditGenerated };
};
