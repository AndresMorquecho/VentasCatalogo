
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyRulesApi, loyaltyPrizesApi, loyaltyRedemptionsApi, loyaltyBalancesApi } from '../lib/loyaltyApi';
import type { LoyaltyRuleFormData, LoyaltyPrizeFormData } from './types';
import { logAction } from '@/shared/lib/auditService';
import { useAuth } from '@/shared/auth';

function useActor() {
    const { user } = useAuth();
    return {
        userId: user?.id ?? 'system',
        userName: user?.username ?? 'Sistema',
    };
}

// ─── Rules ────────────────────────────────────────────────────────────────────
export const useLoyaltyRules = () => {
    const qc = useQueryClient();
    const actor = useActor();
    const key = ['loyalty-rules'];

    const { data: rules = [], isLoading } = useQuery({
        queryKey: key,
        queryFn: () => loyaltyRulesApi.getAll()
    });

    const { mutateAsync: createRule, isPending: isCreating } = useMutation({
        mutationFn: (data: LoyaltyRuleFormData) => loyaltyRulesApi.create(data),
        onSuccess: (rule) => {
            logAction({ ...actor, action: 'CREATE_LOYALTY_RULE', module: 'loyalty', detail: `Creó regla: "${rule.name}"` });
            qc.invalidateQueries({ queryKey: ['loyalty-rules'] });
        },
    });

    const { mutateAsync: updateRule, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LoyaltyRuleFormData> }) =>
            loyaltyRulesApi.update(id, data),
        onSuccess: (rule) => {
            logAction({ ...actor, action: 'UPDATE_LOYALTY_RULE', module: 'loyalty', detail: `Actualizó regla: "${rule.name}"` });
            qc.invalidateQueries({ queryKey: ['loyalty-rules'] });
        },
    });

    const { mutateAsync: deleteRule } = useMutation({
        mutationFn: (id: string) => loyaltyRulesApi.remove(id),
        onSuccess: (_, id) => {
            logAction({ ...actor, action: 'DELETE_LOYALTY_RULE', module: 'loyalty', detail: `Eliminó regla ID: ${id}` });
            qc.invalidateQueries({ queryKey: ['loyalty-rules'] });
        },
    });

    return { rules, isLoading, createRule, updateRule, deleteRule, isCreating, isUpdating };
};

// ─── Prizes ───────────────────────────────────────────────────────────────────
export const useLoyaltyPrizes = () => {
    const qc = useQueryClient();
    const actor = useActor();
    const key = ['loyalty-prizes'];

    const { data: prizes = [], isLoading } = useQuery({
        queryKey: key,
        queryFn: () => loyaltyPrizesApi.getAll()
    });

    const { mutateAsync: createPrize, isPending: isCreating } = useMutation({
        mutationFn: (data: LoyaltyPrizeFormData) => loyaltyPrizesApi.create(data),
        onSuccess: (prize) => {
            logAction({ ...actor, action: 'CREATE_LOYALTY_PRIZE', module: 'loyalty', detail: `Creó premio: "${prize.name}"` });
            qc.invalidateQueries({ queryKey: ['loyalty-prizes'] });
        },
    });

    const { mutateAsync: updatePrize, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LoyaltyPrizeFormData> }) =>
            loyaltyPrizesApi.update(id, data),
        onSuccess: (prize) => {
            logAction({ ...actor, action: 'UPDATE_LOYALTY_PRIZE', module: 'loyalty', detail: `Actualizó premio: "${prize.name}"` });
            qc.invalidateQueries({ queryKey: ['loyalty-prizes'] });
        },
    });

    const { mutateAsync: deletePrize } = useMutation({
        mutationFn: (id: string) => loyaltyPrizesApi.remove(id),
        onSuccess: (_, id) => {
            logAction({ ...actor, action: 'DELETE_LOYALTY_PRIZE', module: 'loyalty', detail: `Eliminó premio ID: ${id}` });
            qc.invalidateQueries({ queryKey: ['loyalty-prizes'] });
        },
    });

    return { prizes, isLoading, createPrize, updatePrize, deletePrize, isCreating, isUpdating };
};

// ─── Redemptions ──────────────────────────────────────────────────────────────
export const useLoyaltyRedemptions = (params?: { page?: number; limit?: number }) => {
    const qc = useQueryClient();
    const actor = useActor();
    const key = ['loyalty-redemptions', params];

    const { data: response, isLoading, refetch } = useQuery({
        queryKey: key,
        queryFn: () => loyaltyRedemptionsApi.getAll(params),
        placeholderData: (prev) => prev
    });
    const redemptions = response?.data || [];
    const pagination = response?.pagination;

    const { mutateAsync: redeemPrize, isPending: isRedeeming } = useMutation({
        mutationFn: (data: { clientId: string, ruleId: string }) => loyaltyRedemptionsApi.redeem(data),
        onSuccess: (redemption) => {
            logAction({ ...actor, action: 'LOYALTY_REDEMPTION', module: 'loyalty', detail: `El cliente (${redemption.clientId}) canjeó el premio: ${redemption.prizeName}` });
            qc.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
            qc.invalidateQueries({ queryKey: ['loyalty-balances'] });
        },
    });

    return { redemptions, pagination, isLoading, refetch, redeemPrize, isRedeeming };
};

// ─── Balances ────────────────────────────────────────────────────────────────
export const useLoyaltyBalances = (params?: { page?: number; limit?: number, search?: string }) => {
    const key = ['loyalty-balances', params];
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: key,
        queryFn: () => loyaltyBalancesApi.getAll(params),
        placeholderData: (prev) => prev
    });
    return {
        balances: response?.data || [],
        pagination: response?.pagination,
        isLoading,
        refetch
    };
};

export const useLoyaltyHistory = (clientId: string | null, params?: { page?: number; limit?: number }) => {
    const key = ['loyalty-history', clientId, params];
    const { data: response, isLoading } = useQuery({
        queryKey: key,
        queryFn: () => loyaltyRedemptionsApi.getHistory(clientId!, params),
        enabled: !!clientId,
        placeholderData: (prev) => prev
    });
    return {
        history: response?.data || [],
        pagination: response?.pagination,
        isLoading
    };
};

