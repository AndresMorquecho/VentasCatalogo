
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyRulesApi, loyaltyPrizesApi, loyaltyRedemptionsApi } from '../lib/loyaltyApi';
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
export const useLoyaltyRules = (params?: { page?: number; limit?: number }) => {
    const qc = useQueryClient();
    const actor = useActor();
    const key = ['loyalty-rules', params];

    const { data: response, isLoading } = useQuery({
        queryKey: key,
        queryFn: () => loyaltyRulesApi.getAll(params),
        placeholderData: (prev) => prev
    });
    const rules = response?.data || [];
    const pagination = response?.pagination;

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

    const { mutateAsync: toggleRule } = useMutation({
        mutationFn: (id: string) => loyaltyRulesApi.toggle(id),
        onSuccess: (rule) => {
            if (rule) {
                logAction({ ...actor, action: 'UPDATE_LOYALTY_RULE', module: 'loyalty', detail: `${rule.isActive ? 'Activó' : 'Desactivó'} regla: "${rule.name}"` });
            }
            qc.invalidateQueries({ queryKey: ['loyalty-rules'] });
        },
    });

    return { rules, pagination, isLoading, createRule, updateRule, deleteRule, toggleRule, isCreating, isUpdating };
};

// ─── Prizes ───────────────────────────────────────────────────────────────────
export const useLoyaltyPrizes = (params?: { page?: number; limit?: number }) => {
    const qc = useQueryClient();
    const actor = useActor();
    const key = ['loyalty-prizes', params];

    const { data: response, isLoading } = useQuery({
        queryKey: key,
        queryFn: () => loyaltyPrizesApi.getAll(params),
        placeholderData: (prev) => prev
    });
    const prizes = response?.data || [];
    const pagination = response?.pagination;

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

    const { mutateAsync: togglePrize } = useMutation({
        mutationFn: (id: string) => loyaltyPrizesApi.toggle(id),
        onSuccess: (prize) => {
            if (prize) {
                logAction({ ...actor, action: 'UPDATE_LOYALTY_PRIZE', module: 'loyalty', detail: `${prize.isActive ? 'Activó' : 'Desactivó'} premio: "${prize.name}"` });
            }
            qc.invalidateQueries({ queryKey: ['loyalty-prizes'] });
        },
    });

    return { prizes, pagination, isLoading, createPrize, updatePrize, deletePrize, togglePrize, isCreating, isUpdating };
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
        mutationFn: (data: { clientId: string, prizeId: string }) => loyaltyRedemptionsApi.redeem(data),
        onSuccess: (redemption) => {
            logAction({ ...actor, action: 'LOYALTY_REDEMPTION', module: 'loyalty', detail: `El cliente (${redemption.clientId}) canjeó el premio: ${redemption.prizeName} por ${redemption.pointsUsed} puntos.` });
            qc.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
            qc.invalidateQueries({ queryKey: ['rewards'] });
            qc.invalidateQueries({ queryKey: ['client-rewards'] });
        },
    });

    return { redemptions, pagination, isLoading, refetch, redeemPrize, isRedeeming };
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

