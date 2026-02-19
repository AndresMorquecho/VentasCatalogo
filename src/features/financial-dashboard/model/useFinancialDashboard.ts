import { useMemo } from 'react';
import { useFinancialMovements } from '@/features/financial-movement/api/hooks';
import { getCashFlowSummary } from '@/entities/financial-movement/model';
import type { CashFlowSummary } from '@/entities/financial-movement/model';

export interface FinancialDashboardData {
    summary: CashFlowSummary;
    loading: boolean;
    error: Error | null;
}

/**
 * Hook for Financial Dashboard
 * Orchestrates data fetching and applies pure query functions
 * NO business logic - only composition
 */
export function useFinancialDashboard(): FinancialDashboardData {
    const { data: movements = [], isLoading, error } = useFinancialMovements();
    
    // Apply pure query function from entity
    const summary = useMemo(() => {
        return getCashFlowSummary(movements);
    }, [movements]);
    
    return {
        summary,
        loading: isLoading,
        error: error as Error | null
    };
}
