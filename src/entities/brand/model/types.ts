export interface Brand {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateBrandPayload {
    name: string;
    description?: string;
    isActive: boolean;
}

export interface UpdateBrandPayload {
    name?: string;
    description?: string;
    isActive?: boolean;
}

/** @deprecated Use CreateBrandPayload instead */
export type BrandPayload = CreateBrandPayload;
