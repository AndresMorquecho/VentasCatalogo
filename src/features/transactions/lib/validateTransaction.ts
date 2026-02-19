import type { FinancialTransaction } from "@/entities/financial-transaction/model/types";
import { transactionApi } from "@/shared/api/transactionApi";

export const validateTransaction = async (data: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
    // 1. Amount > 0
    if (data.amount <= 0) {
        throw new Error("El monto debe ser mayor a 0");
    }

    // 2. ClientId required
    if (!data.clientId) {
        throw new Error("El cliente es obligatorio");
    }

    // 3. Reference mandatory for transactional types
    if (!data.referenceNumber || data.referenceNumber.trim() === "") {
        throw new Error("El número de referencia es obligatorio para transacciones bancarias.");
    }

    // 4. Check uniqueness
    const existing = await transactionApi.findByReference(data.referenceNumber);
    if (existing) {
        // Format date and user info from existing record
        const dateStr = new Date(existing.createdAt).toLocaleDateString();
        throw new Error(`Esta referencia ya fue registrada el ${dateStr} por ${existing.createdBy}.`);
    }

    return true;
};
