export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
    id: string;
    username: string;
    email?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastAccessAt?: string;
}

export interface UserPayload {
    username: string;
    email?: string;
    password?: string;
    role: string;
    isActive: boolean;
}
