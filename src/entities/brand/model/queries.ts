import type { Brand } from './types';

/**
 * Pure function to find a brand by ID.
 */
export function getBrandById(brands: Brand[], id: string): Brand | undefined {
    return brands.find(b => b.id === id);
}

/**
 * Pure function to search brands by name (case-insensitive, partial match).
 */
export function searchBrands(brands: Brand[], query: string): Brand[] {
    if (!query || query.trim().length === 0) return brands;
    const normalizedQuery = query.toLowerCase().trim();
    return brands.filter(b =>
        b.name.toLowerCase().includes(normalizedQuery) ||
        (b.description && b.description.toLowerCase().includes(normalizedQuery))
    );
}

/**
 * Pure function to sort brands alphabetically by name.
 */
export function sortBrandsByName(brands: Brand[], direction: 'asc' | 'desc' = 'asc'): Brand[] {
    return [...brands].sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return direction === 'asc' ? comparison : -comparison;
    });
}

/**
 * Pure function to get only active brands.
 * Note: also available as getActiveBrands in model.ts for backward compatibility.
 */
export function filterActiveBrands(brands: Brand[]): Brand[] {
    return brands.filter(b => b.isActive);
}

/**
 * Pure function to get only inactive brands.
 */
export function filterInactiveBrands(brands: Brand[]): Brand[] {
    return brands.filter(b => !b.isActive);
}
