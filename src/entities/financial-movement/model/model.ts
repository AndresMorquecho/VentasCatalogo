import type { FinancialMovement, CreateFinancialMovementPayload } from './types';

// Pure function to prepare a new financial movement
export const createFinancialMovement = (
    payload: CreateFinancialMovementPayload
): FinancialMovement => {
    return {
        id: String(Date.now()) + Math.random().toString(36).substr(2, 5), // Ensure uniqueness
        ...payload,
        createdAt: new Date().toISOString()
    };
};

// Pure function to update a movement (if ever needed)
export const updateFinancialMovement = (
    movement: FinancialMovement,
    updates: Partial<Omit<FinancialMovement, 'id' | 'createdAt'>>
): FinancialMovement => {
    return {
        ...movement,
        ...updates,
        updatedAt: new Date().toISOString()
    };
};
