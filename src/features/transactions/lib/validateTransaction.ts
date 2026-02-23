// Validation for Financial Records
// DEPRECATED: This validation logic should be moved to backend

import type { FinancialRecord } from "@/entities/financial-record/model/types";

export const validateTransaction = async (data: Omit<FinancialRecord, 'id' | 'createdAt' | 'version'>) => {
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

    // 4. Check uniqueness (this should be done by backend)
    // For now, we skip this check as it requires a new endpoint
    // TODO: Backend should validate uniqueness of referenceNumber
    
    return true;
};
