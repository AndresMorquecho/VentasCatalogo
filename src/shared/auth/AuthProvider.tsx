
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
        if (!raw) return null;
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

function saveSession(u: AuthUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
}

function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}

// ─── Context Definition ───────────────────────────────────────────────────────
export interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
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

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // authApi.login already calls logAction('LOGIN') on success
            // and logAction('LOGIN_FAILED') on failure — no duplication needed here
            const result = await usersApi.login(email, password);
            const authUser: AuthUser = {
                id: result.id,
                firstName: result.firstName,
                lastName: result.lastName,
                email: result.email,
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
                userName: `${user.firstName} ${user.lastName}`,
                action: 'LOGOUT',
                module: 'auth',
                detail: 'Cerró sesión',
            });
        }
        setUser(null);
    }, [user]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!user) return false;
        return user.role.permissions.includes(permission);
    }, [user]);

    const isAdmin = useCallback((): boolean => {
        return user?.role.name === 'ADMIN';
    }, [user]);

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
