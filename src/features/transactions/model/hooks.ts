import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi, clientCreditApi } from "@/shared/api/transactionApi";
import type { FinancialTransaction } from "@/entities/financial-transaction/model/types";
import type { ClientCredit } from "@/entities/client-credit/model/types";

export interface TransactionFilters {
    startDate?: string;
    endDate?: string;
    referenceNumber?: string;
    clientId?: string;
}

export const useTransactions = (filters?: TransactionFilters) => {
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: () => transactionApi.getAll(filters)
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<FinancialTransaction, 'id' | 'createdAt'>) => transactionApi.createTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });
};

export const useClientCredits = (clientId: string) => {
    return useQuery({
        queryKey: ['client-credits', clientId],
        queryFn: () => clientCreditApi.getByClient(clientId),
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
