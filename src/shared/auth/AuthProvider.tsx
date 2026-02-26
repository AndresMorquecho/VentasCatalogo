
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AuthUser } from './types';
import type { Permission } from '@/shared/lib/permissions';
import { usersApi } from './authApi';
import { logAction } from '@/shared/lib/auditService';

// ─── Storage key ──────────────────────────────────────────────────────────────
const SESSION_KEY = 'temu_session';

function loadSession(): AuthUser | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) return JSON.parse(raw) as AuthUser;

        // --- BRIDGE: check legacy session if new one is missing ---
        const legacyUserRaw = localStorage.getItem('user');
        const legacyToken = localStorage.getItem('token');
        if (legacyUserRaw && legacyToken) {
            const legacyUserToken = JSON.parse(legacyUserRaw);
            // Default mock role for legacy users
            const isAdmin = legacyUserToken.role === 'ADMIN';
            return {
                id: legacyUserToken.id,
                username: legacyUserToken.name || 'usuario_migrado',
                role: {
                    id: isAdmin ? 'role-admin' : 'role-user',
                    name: legacyUserToken.role,
                    description: 'Sesión migrada',
                    permissions: (isAdmin ? ['dashboard.view', 'users.view'] : ['dashboard.view']) as Permission[],
                    active: true,
                    createdAt: new Date().toISOString()
                }
            };
        }
        return null;
    } catch {
        return null;
    }
}

function saveSession(u: AuthUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
}

function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('token');
}

// ─── Context Definition ───────────────────────────────────────────────────────
export interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    hasPermission: (permission: Permission) => boolean;
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    // Restore session from localStorage on mount
    const [user, setUser] = useState<AuthUser | null>(() => loadSession());
    const [isLoading, setIsLoading] = useState(false);

    // Sync to localStorage whenever user changes
    useEffect(() => {
        if (user) {
            saveSession(user);
        } else {
            clearSession();
        }
    }, [user]);

    const login = useCallback(async (username: string, password: string) => {
        setIsLoading(true);
        try {
            // authApi.login already calls logAction('LOGIN') on success
            // and logAction('LOGIN_FAILED') on failure — no duplication needed here
            const result = await usersApi.login(username, password);
            const authUser: AuthUser = {
                id: result.id,
                username: result.username,
                role: result.role,
            };
            setUser(authUser);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        if (user) {
            logAction({
                userId: user.id,
                userName: user.username,
                action: 'LOGOUT',
                module: 'auth',
                detail: 'Cerró sesión',
            });
        }
        setUser(null);
    }, [user]);

    const isAdmin = useCallback((): boolean => {
        const roleName = user?.role.name?.toUpperCase() || '';
        return roleName === 'ADMIN';
    }, [user]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!user) return false;
        if (isAdmin()) return true; // Admins ALWAYS have all permissions
        return user.role.permissions.includes(permission);
    }, [user, isAdmin]);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
