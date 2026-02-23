import { useQuery } from '@tanstack/react-query';
import { financialRecordApi } from '@/entities/financial-record/model/api';

export const FINANCIAL_MOVEMENT_QUERY_KEYS = {
    all: ['financial-movements'] as const,
    list: () => [...FINANCIAL_MOVEMENT_QUERY_KEYS.all, 'list'] as const,
};

export function useFinancialMovements() {
    return useQuery({
        queryKey: FINANCIAL_MOVEMENT_QUERY_KEYS.list(),
        queryFn: financialRecordApi.getAll,
    });
}
