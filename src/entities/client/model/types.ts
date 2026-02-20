export type IdentificationType = 'CEDULA';

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
    createdAt: string;
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
}
