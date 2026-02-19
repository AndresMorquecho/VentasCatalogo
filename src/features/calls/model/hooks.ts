
import { useState, useEffect } from 'react';
import type { CallRecord } from '@/entities/call-record/model/types';
import { useSessionStore } from '@/entities/session/model/store'; // Use user info

// Mock data store (in memory for demo)
let MOCK_CALLS: CallRecord[] = [
  {
    id: '1',
    clientId: 'c1',
    reason: 'COBRO',
    result: 'NO_CONTESTA',
    createdAt: new Date().toISOString(),
    createdBy: 'admin@example.com',
    observations: 'Primer intento',
  },
   {
    id: '2',
    clientId: 'c2',
    reason: 'VENTA',
    result: 'INTERESADO',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'vendedor@example.com',
    observations: 'Quiere ver catálogo nuevo',
  }
];

export const useCalls = () => {
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCalls = async () => {
        setIsLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setCalls([...MOCK_CALLS]);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCalls();
    }, []);

    const user = useSessionStore(state => state.user);

    const addCall = async (call: Omit<CallRecord, 'id' | 'createdAt' | 'createdBy'>) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const newCall: CallRecord = {
            ...call,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            createdBy: user?.email || 'unknown',
        };
        MOCK_CALLS = [newCall, ...MOCK_CALLS];
        setCalls([...MOCK_CALLS]);
        setIsLoading(false);
        return newCall;
    };

    return {
        calls,
        isLoading,
        addCall,
        refetch: fetchCalls
    };
};
