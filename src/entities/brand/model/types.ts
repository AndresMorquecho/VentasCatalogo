export interface Brand {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export interface BrandPayload {
    name: string;
    description?: string;
    isActive: boolean;
}
