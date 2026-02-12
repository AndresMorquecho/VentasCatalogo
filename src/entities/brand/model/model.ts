import type { Brand } from "./types";

export function getActiveBrands(brands: Brand[]): Brand[] {
    return brands.filter(brand => brand.isActive);
}
