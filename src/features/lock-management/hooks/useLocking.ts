import { useState, useEffect, useRef, useCallback } from 'react';
import { locksApi } from '../api/locksApi';
import { useNotifications } from '@/shared/lib/notifications';

interface UseLockingProps {
    resourceId: string | undefined;
    resourceType: string;
    enabled?: boolean;
}

export function useLocking({ resourceId, resourceType, enabled = true }: UseLockingProps) {
    const [isLockedByOther, setIsLockedByOther] = useState(false);
    const [lockingUser, setLockingUser] = useState<string | null>(null);
    const [isLockingLoading, setIsLockingLoading] = useState(false);
    const { notifyError } = useNotifications();
    const heartbeatInterval = useRef<any>(null);
    const hasReleased = useRef(false);

    const releaseLock = useCallback(async () => {
        if (!resourceId || hasReleased.current) return;
        try {
            await locksApi.release(resourceId, resourceType);
            hasReleased.current = true;
        } catch (error) {
            console.error('Error releasing lock:', error);
        }
    }, [resourceId, resourceType]);

    const acquireLock = useCallback(async () => {
        if (!resourceId || !enabled) return;
        
        setIsLockingLoading(true);
        setIsLockedByOther(false);
        setLockingUser(null);
        hasReleased.current = false;

        try {
            await locksApi.acquire(resourceId, resourceType);
            
            // Start heartbeat
            if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = setInterval(async () => {
                try {
                    await locksApi.heartbeat(resourceId, resourceType);
                } catch (error: any) {
                    // If heartbeat fails (409 conflict), it means someone else took it or it expired
                    console.error('Heartbeat failed:', error);
                if (error.status === 409) {
                    setIsLockedByOther(true);
                    setLockingUser('Sesión Expirada / Re-adquirida');
                    clearInterval(heartbeatInterval.current);
                }
            }
        }, 60000); // Every 1 minute

    } catch (error: any) {
        if (error.status === 409) {
            setIsLockedByOther(true);
            setLockingUser(error.message || 'Otro usuario');
        } else {
            console.error('Error acquiring lock:', error);
        }
    } finally {
        setIsLockingLoading(false);
    }
}, [resourceId, resourceType, enabled]);

    useEffect(() => {
        if (enabled && resourceId) {
            acquireLock();
        }

        return () => {
            if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
            releaseLock();
        };
    }, [resourceId, enabled, acquireLock, releaseLock]);

    return {
        isLockedByOther,
        lockingUser,
        isLockingLoading,
        releaseLock,
        reAcquire: acquireLock
    };
}
