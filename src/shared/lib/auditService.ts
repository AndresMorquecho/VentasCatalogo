
/**
 * AuditService — Singleton global para registro de auditoría.
 *
 * Usar con: auditService.log({ ... })
 * Leer con: auditService.getAll() / auditService.subscribe(cb)
 *
 * Reemplazar en backend: sustituir el array en memoria por un fetch POST a /api/audit
 */
import type { AuditAction, AuditEntry, AuditSeverity, LogActionParams } from '@/shared/auth/types';

// ─── Severity auto-assignment ────────────────────────────────────────────────
const CRITICAL_ACTIONS: AuditAction[] = [
    'DELETE_ROLE', 'DEACTIVATE_USER', 'DELETE_ORDER',
    'DELETE_PAYMENT', 'CLOSE_CASH',
    'DELETE_LOYALTY_RULE', 'DELETE_LOYALTY_PRIZE',
    'CHANGE_PERMISSIONS', 'LOGIN_FAILED',
];

const WARNING_ACTIONS: AuditAction[] = [
    'CHANGE_PASSWORD', 'UPDATE_ROLE', 'UPDATE_USER',
    'UPDATE_LOYALTY_RULE', 'UPDATE_LOYALTY_PRIZE',
    'LOYALTY_REDEMPTION',
];

function resolveSeverity(action: AuditAction, explicit?: AuditSeverity): AuditSeverity {
    if (explicit) return explicit;
    if (CRITICAL_ACTIONS.includes(action as AuditAction)) return 'CRITICAL';
    if (WARNING_ACTIONS.includes(action as AuditAction)) return 'WARNING';
    return 'INFO';
}

// ─── In-memory store ─────────────────────────────────────────────────────────
let ENTRIES: AuditEntry[] = [];
type Listener = (entries: AuditEntry[]) => void;
const listeners: Set<Listener> = new Set();

const notify = () => { listeners.forEach(fn => fn([...ENTRIES])); };

// ─── Service ─────────────────────────────────────────────────────────────────
export const auditService = {
    /**
     * Log an action. Call this from any API function or mutation.
     */
    log(params: LogActionParams): void {
        const entry: AuditEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId: params.userId,
            userName: params.userName,
            action: params.action,
            module: params.module,
            detail: params.detail,
            severity: resolveSeverity(params.action, params.severity),
            timestamp: new Date().toISOString(),
            success: params.success ?? true,
        };
        ENTRIES.unshift(entry);
        // Keep max 1000 entries in memory
        if (ENTRIES.length > 1000) ENTRIES = ENTRIES.slice(0, 1000);
        notify();
    },

    getAll(): AuditEntry[] {
        return [...ENTRIES];
    },

    /** Subscribe to real-time changes */
    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        listener([...ENTRIES]); // emit current state immediately
        return () => listeners.delete(listener);
    },

    /** Get today's entry count */
    todayCount(): number {
        const today = new Date().toDateString();
        return ENTRIES.filter(e => new Date(e.timestamp).toDateString() === today).length;
    },

    /** Get count of CRITICAL entries today */
    todayCriticalCount(): number {
        const today = new Date().toDateString();
        return ENTRIES.filter(e =>
            e.severity === 'CRITICAL' && new Date(e.timestamp).toDateString() === today
        ).length;
    },
};

// ─── Convenient shorthand ─────────────────────────────────────────────────────
export const logAction = (params: LogActionParams) => auditService.log(params);
