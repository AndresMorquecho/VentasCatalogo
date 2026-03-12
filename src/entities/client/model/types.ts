export type IdentificationType = 'CEDULA' | 'CEDULA_EXTRANJERA' | 'RUC';

export interface Client {
    id: string;
    identificationType: IdentificationType;
    identificationNumber: string;
    firstName: string;
    country: string;
    province: string;
    city: string;
    address: string;
    neighborhood?: string;
    sector?: string;
    email: string;
    reference?: string;
    phone1: string;
    operator1: string;
    phone2?: string;
    operator2?: string;

    // Nuevos campos FASE 1 & 2
    birthDate?: string;
    isWhatsApp: boolean;
    referredById?: string;
    lastDataUpdate?: string;
    lastOrderDate?: string;
    lastBrandName?: string;
    isBlocked: boolean;
    createdByName?: string;

    createdAt: string;

    clientAccount?: {
        totalOrders: number;
        totalSpent: number;
        rewardLevel: string;
        totalCreditAvailable: number;
    };
}

export interface ClientPayload {
    identificationType: IdentificationType;
    identificationNumber: string;
    firstName: string;
    country: string;
    province: string;
    city: string;
    address: string;
    neighborhood?: string;
    sector?: string;
    email: string;
    reference?: string;
    phone1: string;
    operator1: string;
    phone2?: string;
    operator2?: string;

    // Nuevos campos FASE 1 & 2
    birthDate?: string | null;
    isWhatsApp?: boolean;
    referredById?: string | null;
}

