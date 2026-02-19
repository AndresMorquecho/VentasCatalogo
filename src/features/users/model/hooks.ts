
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { usersApi, rolesApi } from '@/shared/auth/authApi';
import { useAuth } from '@/shared/auth';
import { auditService } from '@/shared/lib/auditService';
import type { AuditEntry } from '@/shared/auth/types';
import type { UserFormData, RoleFormData } from '@/shared/auth';

// ─── Roles ────────────────────────────────────────────────────────────────────
export const useRoles = () => {
    const qc = useQueryClient();
    const { user } = useAuth();
    const actorId = user?.id ?? '';
    const actorName = user ? `${user.firstName} ${user.lastName}` : 'Sistema';
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
    const actorName = user ? `${user.firstName} ${user.lastName}` : 'Sistema';
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

    const { mutateAsync: deactivateUser } = useMutation({
        mutationFn: (id: string) => usersApi.softDelete(id, actorId, actorName),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    return { users, isLoading, createUser, updateUser, changePassword, deactivateUser, isCreating, isUpdating };
};

// ─── Audit Log — real-time subscription ──────────────────────────────────────
export const useAuditLog = () => {
    const [entries, setEntries] = useState<AuditEntry[]>(() => auditService.getAll());

    useEffect(() => {
        const unsubscribe = auditService.subscribe(setEntries);
        return unsubscribe;
    }, []);

    return { entries, isLoading: false };
};
