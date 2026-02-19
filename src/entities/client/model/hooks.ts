import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/shared/api/clientApi";

export const useClients = () => {
    return useQuery({
        queryKey: ["clients"],
        queryFn: clientApi.getAll,
    });
};
