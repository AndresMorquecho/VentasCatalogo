import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Permission } from '@/shared/lib/permissions';
import { useAuth } from './AuthProvider';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    permission?: Permission;
    adminOnly?: boolean;
    redirectTo?: string;
}

/**
 * Wraps a route and protects unauthorized access.
 */
export function ProtectedRoute({
    children,
    permission,
    adminOnly = false,
}: ProtectedRouteProps) {
    const { user, hasPermission, isAdmin } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    // If user is logged in but doesn't have required permission/admin status
    const unauthorized = (adminOnly && !isAdmin()) || (permission && !hasPermission(permission));

    if (unauthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in duration-500">
                <div className="p-4 rounded-full bg-red-50 mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Acceso Restringido</h2>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    No tienes los permisos necesarios para acceder a esta vista.
                    Si crees que esto es un error, contacta al administrador del sistema.
                </p>
                <div className="mt-6">
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors"
                    >
                        Volver Atrás
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
