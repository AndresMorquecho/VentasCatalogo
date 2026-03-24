import { useQuery } from "@tanstack/react-query";
import { bankAccountApi } from "./api";

export const useBankAccounts = (params?: { page?: number; limit?: number }) => {
    return useQuery({
        queryKey: ['bank-accounts', params],
        queryFn: () => bankAccountApi.getAll(params),
        placeholderData: (prev) => prev
    });
};

export const useBankAccount = (id: string) => {
    return useQuery({
        queryKey: ['bank-account', id],
        queryFn: () => bankAccountApi.getById(id),
        enabled: !!id
    });
};
