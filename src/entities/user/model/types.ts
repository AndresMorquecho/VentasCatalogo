export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    lastAccess?: string;
}

export interface UserPayload {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}
