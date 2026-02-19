import type { Client, ClientPayload } from './types';

/**
 * Creates a new Client object from a payload.
 * Assigns a unique ID and creation timestamp.
 */
export function createClient(data: ClientPayload): Client {
    return {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Returns a new Client with the specified updates applied.
 * Does NOT mutate the original client.
 */
export function updateClient(client: Client, updates: Partial<ClientPayload>): Client {
    return {
        ...client,
        ...updates,
    };
}

/**
 * Validation errors type
 */
export type ClientValidationErrors = Partial<Record<keyof ClientPayload, string>>;

/**
 * Validates a client payload and returns an object of field-level errors.
 * Returns an empty object if the payload is valid.
 * Pure function — no side effects.
 */
export function validateClient(data: Partial<ClientPayload>): ClientValidationErrors {
    const errors: ClientValidationErrors = {};

    // Required string fields
    if (!data.identificationNumber || data.identificationNumber.trim().length === 0) {
        errors.identificationNumber = 'El número de identificación es requerido';
    } else if (!/^\d{10,13}$/.test(data.identificationNumber.trim())) {
        errors.identificationNumber = 'El número de identificación debe tener entre 10 y 13 dígitos';
    }

    if (!data.firstName || data.firstName.trim().length === 0) {
        errors.firstName = 'El nombre es requerido';
    }

    if (!data.country || data.country.trim().length === 0) {
        errors.country = 'El país es requerido';
    }

    if (!data.province || data.province.trim().length === 0) {
        errors.province = 'La provincia es requerida';
    }

    if (!data.city || data.city.trim().length === 0) {
        errors.city = 'La ciudad es requerida';
    }

    if (!data.address || data.address.trim().length === 0) {
        errors.address = 'La dirección es requerida';
    }

    if (!data.email || data.email.trim().length === 0) {
        errors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = 'El formato del correo electrónico no es válido';
    }

    if (!data.phone1 || data.phone1.trim().length === 0) {
        errors.phone1 = 'El teléfono principal es requerido';
    } else if (!/^\d{7,15}$/.test(data.phone1.trim())) {
        errors.phone1 = 'El teléfono debe contener entre 7 y 15 dígitos';
    }

    if (!data.operator1 || data.operator1.trim().length === 0) {
        errors.operator1 = 'La operadora del teléfono principal es requerida';
    }

    // Optional phone2 validation (only if provided)
    if (data.phone2 && data.phone2.trim().length > 0) {
        if (!/^\d{7,15}$/.test(data.phone2.trim())) {
            errors.phone2 = 'El teléfono debe contener entre 7 y 15 dígitos';
        }
    }

    return errors;
}

/**
 * Checks if the client can be safely deleted by verifying no orders reference it.
 * Returns true if deletion is safe, false otherwise.
 */
export function canDeleteClient(clientId: string, orderClientIds: string[]): boolean {
    return !orderClientIds.includes(clientId);
}
