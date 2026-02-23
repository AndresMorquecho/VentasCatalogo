import { useMemo } from 'react';
import { useFinancialRecords } from '@/entities/financial-record/model/queries';
import { getCashFlowSummary } from '@/entities/financial-record/model/model';
import type { CashFlowSummary } from '@/entities/financial-record/model/model';

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
    const { data: records = [], isLoading, error } = useFinancialRecords();
    
    // Apply pure query function from entity
    const summary = useMemo(() => {
        return getCashFlowSummary(records);
    }, [records]);
    
    return {
        summary,
        loading: isLoading,
        error: error as Error | null
    };
}
