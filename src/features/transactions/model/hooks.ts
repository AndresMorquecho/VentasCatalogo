import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientCreditApi } from "@/shared/api/clientCreditApi";
import { financialRecordApi } from "@/entities/financial-record/model/api";
import type { ClientCredit } from "@/entities/client-credit/model/types";
import type { FinancialRecord } from "@/entities/financial-record/model/types";

export interface TransactionFilters {
    startDate?: string;
    endDate?: string;
    referenceNumber?: string;
    clientId?: string;
}

export const useTransactions = (filters?: TransactionFilters) => {
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: () => {
            // Map to financial records API
            if (filters?.startDate && filters?.endDate) {
                return financialRecordApi.getByDateRange(filters.startDate, filters.endDate);
            }
            if (filters?.clientId) {
                return financialRecordApi.getByClient(filters.clientId);
            }
            return financialRecordApi.getAll();
        }
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<FinancialRecord, 'id' | 'createdAt' | 'version'>) => financialRecordApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financial-records'] });
        }
    });
};

export const useClientCredits = (clientId: string) => {
    return useQuery({
        queryKey: ['client-credits', clientId],
        queryFn: () => clientCreditApi.getAvailableByClient(clientId),
        enabled: !!clientId
    });
};

export const useCreateCredit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<ClientCredit, 'id' | 'createdAt'>) => clientCreditApi.createCredit(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['client-credits', variables.clientId] });
        }
    });
};
