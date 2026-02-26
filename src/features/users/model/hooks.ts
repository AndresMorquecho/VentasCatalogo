
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi, auditApi } from '@/shared/auth/authApi';
import { useAuth } from '@/shared/auth';
import type { UserFormData, RoleFormData } from '@/shared/auth';

// ─── Roles ────────────────────────────────────────────────────────────────────
export const useRoles = () => {
    const qc = useQueryClient();
    const { user } = useAuth();
    const actorId = user?.id ?? '';
    const actorName = user ? user.username : 'Sistema';
    const key = ['roles'];

    const { data: roles = [], isLoading } = useQuery({ queryKey: key, queryFn: rolesApi.getAll });

    const { mutateAsync: createRole } = useMutation({
        mutationFn: (data: RoleFormData) => rolesApi.create(data, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const { mutateAsync: updateRole } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<RoleFormData> }) =>
            rolesApi.update(id, data, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const { mutateAsync: deleteRole } = useMutation({
        mutationFn: (id: string) => rolesApi.remove(id, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    return { roles, isLoading, createRole, updateRole, deleteRole };
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const useUsers = () => {
    const qc = useQueryClient();
    const { user } = useAuth();
    const actorId = user?.id ?? '';
    const actorName = user ? user.username : 'Sistema';
    const key = ['users'];

    const { data: users = [], isLoading } = useQuery({ queryKey: key, queryFn: usersApi.getAll });

    const { mutateAsync: createUser, isPending: isCreating } = useMutation({
        mutationFn: (data: UserFormData) => usersApi.create(data, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const { mutateAsync: updateUser, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Omit<UserFormData, 'password'>> }) =>
            usersApi.update(id, data, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const { mutateAsync: changePassword } = useMutation({
        mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
            usersApi.changePassword(userId, newPassword, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const { mutateAsync: toggleUserStatus } = useMutation({
        mutationFn: (id: string) => usersApi.toggleStatus(id, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const { mutateAsync: deleteUser } = useMutation({
        mutationFn: (id: string) => usersApi.remove(id, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    return { users, isLoading, createUser, updateUser, changePassword, deactivateUser: toggleUserStatus, deleteUser, isCreating, isUpdating };
};

// ─── Audit Log — fetched from backend ──────────────────────────────────────
export const useAuditLog = () => {
    const { data: entries = [], isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: auditApi.getAll,
        refetchInterval: 30000, // Poll every 30s
    });

    return { entries, isLoading };
};
