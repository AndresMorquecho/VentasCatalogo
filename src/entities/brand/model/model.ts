import type { Brand, CreateBrandPayload, UpdateBrandPayload } from './types';

/**
 * Runtime validation for brand name.
 * TypeScript types are compile-time only — these protect against runtime errors.
 */
function validateBrandName(name: unknown): void {
    if (typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Brand: El nombre es obligatorio');
    }
    if (name.trim().length < 2) {
        throw new Error('Brand: El nombre debe tener al menos 2 caracteres');
    }
    if (name.trim() !== name.trim().replace(/\s{2,}/g, ' ')) {
        throw new Error('Brand: El nombre no debe contener espacios dobles');
    }
}

/**
 * Pure function to create a new Brand.
 * Validates name at runtime.
 */
export function createBrand(payload: CreateBrandPayload): Brand {
    validateBrandName(payload.name);

    return {
        id: crypto.randomUUID(),
        name: payload.name.trim(),
        description: payload.description?.trim() || undefined,
        isActive: payload.isActive ?? true,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Pure function to update an existing Brand.
 * Validates name if provided.
 */
export function updateBrand(brand: Brand, updates: UpdateBrandPayload): Brand {
    if (updates.name !== undefined) {
        validateBrandName(updates.name);
    }

    return {
        ...brand,
        ...(updates.name !== undefined && { name: updates.name.trim() }),
        ...(updates.description !== undefined && { description: updates.description?.trim() || undefined }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Pure function to get only active brands.
 */
export function getActiveBrands(brands: Brand[]): Brand[] {
    return brands.filter(brand => brand.isActive);
}
