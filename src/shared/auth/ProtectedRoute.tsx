
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Permission } from '@/shared/lib/permissions';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
    children: ReactNode;
    permission?: Permission;
    adminOnly?: boolean;
    redirectTo?: string;
}

/**
 * Wraps a route and redirects unauthorized users.
 * Usage: <ProtectedRoute permission="orders.view">...</ProtectedRoute>
 */
export function ProtectedRoute({
    children,
    permission,
    adminOnly = false,
    redirectTo = '/',
}: ProtectedRouteProps) {
    const { user, hasPermission, isAdmin } = useAuth();

    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && !isAdmin()) return <Navigate to={redirectTo} replace />;
    if (permission && !hasPermission(permission)) return <Navigate to={redirectTo} replace />;

    return <>{children}</>;
}
