import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/entities/order/model/api";
import { paymentApi, type MultiplePaymentPayload } from "@/shared/api/paymentApi";

interface PaymentSearchParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

export const usePaymentSearch = (params: PaymentSearchParams = {}) => {
    const { page = 1, limit = 25, search, status } = params;

    // 1️⃣ Fetch Orders with pagination and filters
    const { data: response, isLoading: loading, refetch } = useQuery({
        queryKey: ["orders", "payments-list", page, limit, search, status],
        queryFn: () => orderApi.getAll({
            page,
            limit,
            search,
            status: status === 'ALL' ? undefined : status,
            onlyParents: true
        }),
    });

    const orders = response?.data || [];
    const pagination = response?.pagination;

    return {
        orders,
        pagination,
        loading,
        refetch
    };
};

export const usePaymentOperations = () => {
    const queryClient = useQueryClient();

    // 1️⃣ Register Payment Mutation (legacy single payment)
    const registerPayment = useMutation({
        mutationFn: paymentApi.registerPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] }); // Refetch all orders to update balances
        },
    });

    // 2️⃣ Register Multiple Payments Mutation (new)
    const registerMultiplePayments = useMutation({
        mutationFn: paymentApi.registerMultiplePayments,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] }); // Refetch all orders to update balances
        },
    });

    // 3️⃣ Delete Payment Mutation
    const revertPayment = useMutation({
        mutationFn: ({ orderId, paymentId }: { orderId: string; paymentId: string }) =>
            paymentApi.revertPayment(orderId, paymentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });

    return {
        registerPayment,
        registerMultiplePayments,
        revertPayment,
    };
};
