import { useQuery } from '@tanstack/react-query';
import { financialMovementApi } from './api';

const KEYS = {
    all: ['financial-movements'] as const,
    list: () => [...KEYS.all, 'list'] as const,
};

export function useFinancialMovements() {
    return useQuery({ 
        queryKey: KEYS.list(), 
        queryFn: financialMovementApi.getAll 
    });
}
