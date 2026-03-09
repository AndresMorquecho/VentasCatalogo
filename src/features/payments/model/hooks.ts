import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/entities/order/model/api";
import { useClients } from "@/entities/client/model/hooks";
import { paymentApi } from "@/shared/api/paymentApi";

export const usePaymentSearch = () => {
    // 1️⃣ Fetch Orders
    const { data: ordersResponse, isLoading: loadingOrders } = useQuery({
        queryKey: ["orders", "list"],
        queryFn: () => orderApi.getAll(),
    });

    // 2️⃣ Fetch Clients
    const { data: clientsResponse, isLoading: loadingClients } = useClients();

    const orders = ordersResponse?.data || [];
    const clients = clientsResponse?.data || [];

    const searchOrders = (term: string) => {
        if (!term) return orders;
        const lowerTerm = term.toLowerCase();
        return orders.filter(o =>
            o.clientName.toLowerCase().includes(lowerTerm) ||
            o.receiptNumber.toLowerCase().includes(lowerTerm) ||
            clients.find(c => c.id === o.clientId)?.identificationNumber?.includes(lowerTerm)
        );
    };

    return {
        orders,
        searchOrders,
        loading: loadingOrders || loadingClients,
    };
};


export const usePaymentOperations = () => {
    const queryClient = useQueryClient();

    // 1️⃣ Register Payment Mutation
    const registerPayment = useMutation({
        mutationFn: paymentApi.registerPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] }); // Refetch all orders to update balances
        },
    });

    // 2️⃣ Delete Payment Mutation
    const revertPayment = useMutation({
        mutationFn: ({ orderId, paymentId }: { orderId: string; paymentId: string }) =>
            paymentApi.revertPayment(orderId, paymentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });

    return {
        registerPayment,
        revertPayment,
    };
};
