export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type ClientLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Client {
    id: string;
    name: string;
    phone: string;
    idCard: string;
    address: string;
    city: string;
    status: ClientStatus;
    level: ClientLevel;
    notes?: string;
    registeredAt: string;
}

export interface ClientPayload {
    name: string;
    phone: string;
    idCard: string;
    address: string;
    city: string;
    status: ClientStatus;
    level: ClientLevel;
    notes?: string;
}
