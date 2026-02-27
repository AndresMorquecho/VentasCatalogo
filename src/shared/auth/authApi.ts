
import type { AppRole, AppUser, RoleFormData, UserFormData, AuditEntry } from './types';
import type { Permission } from '@/shared/lib/permissions';
import { logAction } from '@/shared/lib/auditService';
import { httpClient } from '@/shared/lib/httpClient';

// ─── Simple hash simulation (for mock fallback only, not used in real backend) 




// ─── Roles API ────────────────────────────────────────────────────────────────
export const rolesApi = {
    getAll: async (): Promise<AppRole[]> => {
        const response = await httpClient.get<any>('/roles');
        const roles = Array.isArray(response) ? response : response.data || [];

        return roles.map((r: any) => ({
            ...r,
            permissions: r.permissions as Permission[],
            active: r.isActive ?? true
        }));
    },
    create: async (data: RoleFormData, actorId: string, actorName: string): Promise<AppRole> => {
        const role = await httpClient.post<any>('/roles', data);
        logAction({ userId: actorId, userName: actorName, action: 'CREATE_ROLE', module: 'users', detail: `Creó rol: ${role.name}` });
        return {
            ...role,
            permissions: role.permissions as Permission[]
        };
    },
    update: async (id: string, data: Partial<RoleFormData>, actorId: string, actorName: string): Promise<AppRole> => {
        const updated = await httpClient.put<any>(`/roles/${id}`, data);
        logAction({ userId: actorId, userName: actorName, action: 'UPDATE_ROLE', module: 'users', detail: `Actualizó rol: ${updated.name}` });
        return {
            ...updated,
            permissions: updated.permissions as Permission[]
        };
    },
    remove: async (id: string, actorId: string, actorName: string): Promise<void> => {
        await httpClient.delete(`/roles/${id}`);
        logAction({ userId: actorId, userName: actorName, action: 'DELETE_ROLE', module: 'users', detail: `Eliminó rol` });
    },
};

// ─── Users API ────────────────────────────────────────────────────────────────
export const usersApi = {
    getAll: async (): Promise<AppUser[]> => {
        const users = await httpClient.get<any[]>('/users');
        return users.map(u => ({
            ...u,
            roleId: u.role || 'USER', // Use raw role from DB
            active: u.isActive
        }));
    },
    create: async (data: UserFormData, actorId: string, actorName: string): Promise<AppUser> => {
        const payload = {
            username: data.username,
            password: data.password,
            role: data.roleId, // Send raw ID/Name selected
            isActive: data.active
        };
        const user = await httpClient.post<any>('/users', payload);
        logAction({ userId: actorId, userName: actorName, action: 'CREATE_USER', module: 'users', detail: `Creó usuario: ${user.username}` });

        return {
            ...user,
            roleId: user.role,
            active: user.isActive
        };
    },
    update: async (id: string, data: Partial<Omit<UserFormData, 'password'>>, actorId: string, actorName: string): Promise<AppUser> => {
        const payload: any = { ...data };
        if (data.roleId) {
            payload.role = data.roleId.replace('role-', '').toUpperCase();
            delete payload.roleId;
        }
        if (data.active !== undefined) {
            payload.isActive = data.active;
            delete payload.active;
        }

        const updated = await httpClient.put<any>(`/users/${id}`, payload);
        logAction({ userId: actorId, userName: actorName, action: 'UPDATE_USER', module: 'users', detail: `Actualizó usuario: ${updated.username}` });

        return {
            ...updated,
            roleId: updated.role,
            active: updated.isActive
        };
    },
    changePassword: async (userId: string, newPassword: string, actorId: string, actorName: string): Promise<void> => {
        await httpClient.patch(`/users/${userId}/password`, { password: newPassword });
        logAction({ userId: actorId, userName: actorName, action: 'CHANGE_PASSWORD', module: 'users', detail: `Cambió contraseña de usuario` });
    },
    remove: async (id: string, actorId: string, actorName: string): Promise<void> => {
        await httpClient.delete(`/users/${id}`);
        logAction({ userId: actorId, userName: actorName, action: 'DELETE_USER', module: 'users', detail: `Eliminó usuario permanentemente` });
    },
    toggleStatus: async (id: string, actorId: string, actorName: string): Promise<void> => {
        await httpClient.patch(`/users/${id}/toggle-status`, {});
        logAction({ userId: actorId, userName: actorName, action: 'TOGGLE_USER_STATUS', module: 'users', detail: `Cambió estado de usuario` });
    },
    login: async (username: string, password: string): Promise<AppUser & { role: AppRole, token: string }> => {
        try {
            const response = await httpClient.post<{ token: string, user: any }>('/auth/login', {
                username,
                password
            });

            const { token, user: userData } = response;

            // Save token for httpClient
            localStorage.setItem('token', token);

            const user: AppUser = {
                id: userData.id,
                username: userData.username,
                passwordHash: '***',
                roleId: userData.role || '',
                active: userData.isActive ?? true,
                createdAt: userData.createdAt || new Date().toISOString(),
                lastAccessAt: userData.lastAccessAt || null,
            };

            const role: AppRole = {
                id: userData.role || '',
                name: userData.role,
                description: `Rol de ${userData.role}`,
                permissions: (userData.permissions || []) as Permission[],
                active: true,
                createdAt: new Date().toISOString(),
            };

            logAction({
                userId: user.id,
                userName: user.username,
                action: 'LOGIN',
                module: 'auth',
                detail: 'Inició sesión exitosamente backend'
            });

            return { ...user, role, token };
        } catch (err: any) {
            logAction({
                userId: 'anonymous',
                userName: username,
                action: 'LOGIN_FAILED',
                module: 'auth',
                detail: `Error login: ${err.message}`,
                success: false
            });
            throw err;
        }
    },
};

// auditApi 
export const auditApi = {
    getAll: async (): Promise<AuditEntry[]> => {
        return httpClient.get<AuditEntry[]>('/audit');
    },
};
