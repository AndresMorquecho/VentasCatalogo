
import type { Permission } from '@/shared/lib/permissions';

// ─── Roles ────────────────────────────────────────────────────────────────────
export type RoleName = 'ADMIN' | 'CAJERA' | 'OPERADOR' | 'VENDEDOR';

export type AppRole = {
    id: string;
    name: RoleName;
    description: string;
    permissions: Permission[];
    active: boolean;
    createdAt: string;
};

// ─── Users ────────────────────────────────────────────────────────────────────
export type AppUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;   // NEVER store plain text
    roleId: string;
    active: boolean;
    createdAt: string;
    lastAccessAt: string | null;
};

// ─── Auth Session ─────────────────────────────────────────────────────────────
export type AuthUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: AppRole;
};

// ─── Form DTOs ────────────────────────────────────────────────────────────────
export type UserFormData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId: string;
    active: boolean;
};

export type ChangePasswordData = {
    userId: string;
    newPassword: string;
    confirmPassword: string;
};

export type RoleFormData = {
    name: RoleName;
    description: string;
    permissions: Permission[];
    active: boolean;
};


// ─── Audit Log ────────────────────────────────────────────────────────────────
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AuditAction =
    // Auth
    | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
    // Users
    | 'CREATE_USER' | 'UPDATE_USER' | 'DEACTIVATE_USER' | 'REACTIVATE_USER' | 'CHANGE_PASSWORD'
    // Roles & Permissions
    | 'CREATE_ROLE' | 'UPDATE_ROLE' | 'DELETE_ROLE' | 'CHANGE_PERMISSIONS'
    // Orders
    | 'CREATE_ORDER' | 'EDIT_ORDER' | 'DELETE_ORDER' | 'CONFIRM_RECEPTION' | 'CONFIRM_DELIVERY'
    // Finance
    | 'CREATE_PAYMENT' | 'DELETE_PAYMENT' | 'CLOSE_CASH'
    // Loyalty
    | 'CREATE_LOYALTY_RULE' | 'UPDATE_LOYALTY_RULE' | 'DELETE_LOYALTY_RULE'
    | 'CREATE_LOYALTY_PRIZE' | 'UPDATE_LOYALTY_PRIZE' | 'DELETE_LOYALTY_PRIZE'
    | 'LOYALTY_REDEMPTION'
    // Generic
    | string;

export type AuditEntry = {
    id: string;
    userId: string;
    userName: string;
    action: AuditAction;
    module: string;
    detail: string;
    severity: AuditSeverity;
    timestamp: string;
    success: boolean;
};

export type LogActionParams = {
    userId: string;
    userName: string;
    action: AuditAction;
    module: string;
    detail: string;
    severity?: AuditSeverity;
    success?: boolean;
};
