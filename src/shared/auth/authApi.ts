
import type { AppRole, AppUser, RoleFormData, UserFormData } from './types';
import type { Permission } from '@/shared/lib/permissions';
import { logAction } from '@/shared/lib/auditService';

// ─── Simple hash simulation (replace with bcrypt on backend) ─────────────────
const mockHash = (pw: string) => `hashed::${btoa(pw)}`;
const delay = () => new Promise<void>(r => setTimeout(r, 250));

// ─── Seed Roles ───────────────────────────────────────────────────────────────
let ROLES: AppRole[] = [
    {
        id: 'role-admin',
        name: 'ADMIN',
        description: 'Acceso completo al sistema',
        permissions: [
            'dashboard.view',
            'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
            'reception.view', 'reception.confirm',
            'delivery.view', 'delivery.confirm',
            'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
            'transactions.view',
            'payments.view', 'payments.create', 'payments.delete',
            'bank_accounts.view', 'bank_accounts.create', 'bank_accounts.edit', 'bank_accounts.delete',
            'inventory.view', 'inventory.edit',
            'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
            'cash_closure.view', 'cash_closure.close',
            'calls.view', 'calls.create',
            'loyalty.view', 'loyalty.manage_rules', 'loyalty.manage_prizes',
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.change_password', 'users.assign_roles',
        ] as Permission[],
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: 'role-cajera',
        name: 'CAJERA',
        description: 'Acceso a abonos, transacciones y cierre de caja',
        permissions: [
            'dashboard.view',
            'payments.view', 'payments.create',
            'transactions.view',
            'cash_closure.view', 'cash_closure.close',
            'clients.view',
        ] as Permission[],
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: 'role-operador',
        name: 'OPERADOR',
        description: 'Gestión de pedidos, recepción y entregas',
        permissions: [
            'dashboard.view',
            'orders.view', 'orders.create', 'orders.edit',
            'reception.view', 'reception.confirm',
            'delivery.view', 'delivery.confirm',
            'clients.view',
            'inventory.view',
        ] as Permission[],
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: 'role-vendedor',
        name: 'VENDEDOR',
        description: 'Consulta de clientes y pedidos',
        permissions: [
            'dashboard.view',
            'clients.view',
            'orders.view',
            'calls.view', 'calls.create',
        ] as Permission[],
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
    },
];

// ─── Seed Users ───────────────────────────────────────────────────────────────
let USERS: AppUser[] = [
    {
        id: 'user-admin',
        firstName: 'Administrador',
        lastName: 'Principal',
        email: 'admin@temu.com',
        passwordHash: mockHash('Admin123!'),
        roleId: 'role-admin',
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        lastAccessAt: new Date().toISOString(),
    },
    {
        id: 'user-cajera',
        firstName: 'Laura',
        lastName: 'Ramírez',
        email: 'cajera@temu.com',
        passwordHash: mockHash('Caja123!'),
        roleId: 'role-cajera',
        active: true,
        createdAt: '2026-01-15T00:00:00Z',
        lastAccessAt: null,
    },
];



// ─── Roles API ────────────────────────────────────────────────────────────────
export const rolesApi = {
    getAll: async (): Promise<AppRole[]> => {
        await delay();
        return [...ROLES];
    },
    create: async (data: RoleFormData, actorId: string, actorName: string): Promise<AppRole> => {
        await delay();
        const role: AppRole = { ...data, id: `role-${Date.now()}`, createdAt: new Date().toISOString() };
        ROLES = [...ROLES, role];
        logAction({ userId: actorId, userName: actorName, action: 'CREATE_ROLE', module: 'users', detail: `Creó rol: ${role.name}` });
        return role;
    },
    update: async (id: string, data: Partial<RoleFormData>, actorId: string, actorName: string): Promise<AppRole> => {
        await delay();
        ROLES = ROLES.map(r => r.id === id ? { ...r, ...data } : r);
        const updated = ROLES.find(r => r.id === id);
        if (!updated) throw new Error('Role not found');
        logAction({ userId: actorId, userName: actorName, action: 'UPDATE_ROLE', module: 'users', detail: `Actualizó rol: ${updated.name}` });
        return updated;
    },
    remove: async (id: string, actorId: string, actorName: string): Promise<void> => {
        await delay();
        const usersWithRole = USERS.filter(u => u.roleId === id);
        if (usersWithRole.length > 0) throw new Error('No se puede eliminar un rol asignado a usuarios activos.');
        const role = ROLES.find(r => r.id === id);
        ROLES = ROLES.filter(r => r.id !== id);
        logAction({ userId: actorId, userName: actorName, action: 'DELETE_ROLE', module: 'users', detail: `Eliminó rol: ${role?.name}` });
    },
};

// ─── Users API ────────────────────────────────────────────────────────────────
export const usersApi = {
    getAll: async (): Promise<AppUser[]> => {
        await delay();
        return USERS.map(u => ({ ...u, passwordHash: '***' }));
    },
    create: async (data: UserFormData, actorId: string, actorName: string): Promise<AppUser> => {
        await delay();
        if (USERS.find(u => u.email === data.email)) throw new Error('El email ya está en uso.');
        const user: AppUser = {
            id: `user-${Date.now()}`,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash: mockHash(data.password),
            roleId: data.roleId,
            active: data.active,
            createdAt: new Date().toISOString(),
            lastAccessAt: null,
        };
        USERS = [...USERS, user];
        logAction({ userId: actorId, userName: actorName, action: 'CREATE_USER', module: 'users', detail: `Creó usuario: ${user.email}` });
        return { ...user, passwordHash: '***' };
    },
    update: async (id: string, data: Partial<Omit<UserFormData, 'password'>>, actorId: string, actorName: string): Promise<AppUser> => {
        await delay();
        USERS = USERS.map(u => u.id === id ? { ...u, ...data } : u);
        const updated = USERS.find(u => u.id === id);
        if (!updated) throw new Error('User not found');
        logAction({ userId: actorId, userName: actorName, action: 'UPDATE_USER', module: 'users', detail: `Actualizó usuario: ${updated.email}` });
        return { ...updated, passwordHash: '***' };
    },
    changePassword: async (userId: string, newPassword: string, actorId: string, actorName: string): Promise<void> => {
        await delay();
        USERS = USERS.map(u => u.id === userId ? { ...u, passwordHash: mockHash(newPassword) } : u);
        const user = USERS.find(u => u.id === userId);
        logAction({ userId: actorId, userName: actorName, action: 'CHANGE_PASSWORD', module: 'users', detail: `Cambió contraseña de: ${user?.email}` });
    },
    softDelete: async (id: string, actorId: string, actorName: string): Promise<void> => {
        await delay();
        const adminUsers = USERS.filter(u => {
            const role = ROLES.find(r => r.id === u.roleId);
            return role?.name === 'ADMIN' && u.active;
        });
        if (adminUsers.length === 1 && adminUsers[0].id === id) {
            throw new Error('No se puede eliminar el último administrador activo.');
        }
        USERS = USERS.map(u => u.id === id ? { ...u, active: false } : u);
        const user = USERS.find(u => u.id === id);
        logAction({ userId: actorId, userName: actorName, action: 'DEACTIVATE_USER', module: 'users', detail: `Desactivó usuario: ${user?.email}` });
    },
    login: async (email: string, password: string): Promise<AppUser & { role: AppRole }> => {
        await delay();
        const user = USERS.find(u => u.email === email);
        if (!user || !user.active) {
            logAction({ userId: 'anonymous', userName: email, action: 'LOGIN_FAILED', module: 'auth', detail: `Intento de login fallido para: ${email}`, success: false });
            throw new Error('Credenciales inválidas o usuario inactivo.');
        }
        if (user.passwordHash !== mockHash(password)) {
            logAction({ userId: user.id, userName: `${user.firstName} ${user.lastName}`, action: 'LOGIN_FAILED', module: 'auth', detail: `Contraseña incorrecta para: ${email}`, success: false });
            throw new Error('Contraseña incorrecta.');
        }
        const role = ROLES.find(r => r.id === user.roleId);
        if (!role) throw new Error('Rol no encontrado.');
        USERS = USERS.map(u => u.id === user.id ? { ...u, lastAccessAt: new Date().toISOString() } : u);
        logAction({ userId: user.id, userName: `${user.firstName} ${user.lastName}`, action: 'LOGIN', module: 'auth', detail: 'Inició sesión exitosamente' });
        return { ...user, passwordHash: '***', role };
    },
};

// auditApi is now provided by auditService (shared/lib/auditService.ts)
export const auditApi = {
    getAll: async () => {
        const { auditService } = await import('@/shared/lib/auditService');
        return auditService.getAll();
    },
};
