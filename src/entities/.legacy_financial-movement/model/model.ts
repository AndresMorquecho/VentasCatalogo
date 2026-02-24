import type { FinancialMovement, CreateFinancialMovementPayload } from './types';

/**
 * Runtime validations for financial movement creation.
 * TypeScript types are compile-time only — these protect against runtime errors.
 */
function validateFinancialMovementPayload(payload: CreateFinancialMovementPayload): void {
    // Amount must be a positive finite number
    if (typeof payload.amount !== 'number' || !Number.isFinite(payload.amount)) {
        throw new Error('FinancialMovement: El monto debe ser un número válido');
    }
    if (payload.amount <= 0) {
        throw new Error('FinancialMovement: El monto debe ser mayor a 0');
    }

    // bankAccountId is mandatory
    if (!payload.bankAccountId || payload.bankAccountId.trim().length === 0) {
        throw new Error('FinancialMovement: La cuenta bancaria es obligatoria');
    }

    // type must be valid
    const validTypes = ['INCOME', 'EXPENSE'] as const;
    if (!validTypes.includes(payload.type as typeof validTypes[number])) {
        throw new Error(`FinancialMovement: Tipo inválido "${payload.type}". Debe ser INCOME o EXPENSE`);
    }

    // source must be valid
    const validSources = ['ORDER_PAYMENT', 'MANUAL', 'ADJUSTMENT'] as const;
    if (!validSources.includes(payload.source as typeof validSources[number])) {
        throw new Error(`FinancialMovement: Fuente inválida "${payload.source}". Debe ser ORDER_PAYMENT, MANUAL o ADJUSTMENT`);
    }
}

/**
 * Pure function to prepare a new financial movement.
 * VALIDATES all fields at runtime — does not rely only on TypeScript.
 */
export const createFinancialMovement = (
    payload: CreateFinancialMovementPayload
): FinancialMovement => {
    validateFinancialMovementPayload(payload);

    return {
        id: crypto.randomUUID(),
        ...payload,
        createdAt: new Date().toISOString()
    };
};

/**
 * Pure function to update a movement (if ever needed).
 * Validates amount if provided.
 */
export const updateFinancialMovement = (
    movement: FinancialMovement,
    updates: Partial<Omit<FinancialMovement, 'id' | 'createdAt'>>
): FinancialMovement => {
    if (updates.amount !== undefined) {
        if (typeof updates.amount !== 'number' || !Number.isFinite(updates.amount)) {
            throw new Error('FinancialMovement: El monto debe ser un número válido');
        }
        if (updates.amount <= 0) {
            throw new Error('FinancialMovement: El monto debe ser mayor a 0');
        }
    }

    return {
        ...movement,
        ...updates,
        updatedAt: new Date().toISOString()
    };
};
