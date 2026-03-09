import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/shared/api/clientApi";
import type { Client } from "../model/types";
import type { PaginatedResponse } from "@/entities/order/model/types";

export const useClients = (params?: { page?: number; limit?: number; search?: string; active?: boolean }) => {
    return useQuery<PaginatedResponse<Client>>({
        queryKey: ["clients", params],
        queryFn: () => clientApi.getAll(params),
    });
};
