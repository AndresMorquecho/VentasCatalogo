
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
export const useLoyaltyRules = () => {
    const qc = useQueryClient();
    const actor = useActor();
    const key = ['loyalty-rules'];

    const { data: rules = [], isLoading } = useQuery({ queryKey: key, queryFn: loyaltyRulesApi.getAll });

    const { mutateAsync: createRule, isPending: isCreating } = useMutation({
        mutationFn: (data: LoyaltyRuleFormData) => loyaltyRulesApi.create(data),
        onSuccess: (rule) => {
            logAction({ ...actor, action: 'CREATE_LOYALTY_RULE', module: 'loyalty', detail: `Creó regla: "${rule.name}"` });
            qc.invalidateQueries({ queryKey: key });
        },
    });

    const { mutateAsync: updateRule, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LoyaltyRuleFormData> }) =>
            loyaltyRulesApi.update(id, data),
        onSuccess: (rule) => {
            logAction({ ...actor, action: 'UPDATE_LOYALTY_RULE', module: 'loyalty', detail: `Actualizó regla: "${rule.name}"` });
            qc.invalidateQueries({ queryKey: key });
        },
    });

    const { mutateAsync: deleteRule } = useMutation({
        mutationFn: (id: string) => loyaltyRulesApi.remove(id),
        onSuccess: (_, id) => {
            logAction({ ...actor, action: 'DELETE_LOYALTY_RULE', module: 'loyalty', detail: `Eliminó regla ID: ${id}` });
            qc.invalidateQueries({ queryKey: key });
        },
    });

    const { mutateAsync: toggleRule } = useMutation({
        mutationFn: (id: string) => loyaltyRulesApi.toggle(id),
        onSuccess: (rule) => {
            if (rule) {
                logAction({ ...actor, action: 'UPDATE_LOYALTY_RULE', module: 'loyalty', detail: `${rule.isActive ? 'Activó' : 'Desactivó'} regla: "${rule.name}"` });
            }
            qc.invalidateQueries({ queryKey: key });
        },
    });

    return { rules, isLoading, createRule, updateRule, deleteRule, toggleRule, isCreating, isUpdating };
};

// ─── Prizes ───────────────────────────────────────────────────────────────────
export const useLoyaltyPrizes = () => {
    const qc = useQueryClient();
    const actor = useActor();
    const key = ['loyalty-prizes'];

    const { data: prizes = [], isLoading } = useQuery({ queryKey: key, queryFn: loyaltyPrizesApi.getAll });

    const { mutateAsync: createPrize, isPending: isCreating } = useMutation({
        mutationFn: (data: LoyaltyPrizeFormData) => loyaltyPrizesApi.create(data),
        onSuccess: (prize) => {
            logAction({ ...actor, action: 'CREATE_LOYALTY_PRIZE', module: 'loyalty', detail: `Creó premio: "${prize.name}"` });
            qc.invalidateQueries({ queryKey: key });
        },
    });

    const { mutateAsync: updatePrize, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LoyaltyPrizeFormData> }) =>
            loyaltyPrizesApi.update(id, data),
        onSuccess: (prize) => {
            logAction({ ...actor, action: 'UPDATE_LOYALTY_PRIZE', module: 'loyalty', detail: `Actualizó premio: "${prize.name}"` });
            qc.invalidateQueries({ queryKey: key });
        },
    });

    const { mutateAsync: deletePrize } = useMutation({
        mutationFn: (id: string) => loyaltyPrizesApi.remove(id),
        onSuccess: (_, id) => {
            logAction({ ...actor, action: 'DELETE_LOYALTY_PRIZE', module: 'loyalty', detail: `Eliminó premio ID: ${id}` });
            qc.invalidateQueries({ queryKey: key });
        },
    });

    const { mutateAsync: togglePrize } = useMutation({
        mutationFn: (id: string) => loyaltyPrizesApi.toggle(id),
        onSuccess: (prize) => {
            if (prize) {
                logAction({ ...actor, action: 'UPDATE_LOYALTY_PRIZE', module: 'loyalty', detail: `${prize.isActive ? 'Activó' : 'Desactivó'} premio: "${prize.name}"` });
            }
            qc.invalidateQueries({ queryKey: key });
        },
    });

    return { prizes, isLoading, createPrize, updatePrize, deletePrize, togglePrize, isCreating, isUpdating };
};

// ─── Redemptions ──────────────────────────────────────────────────────────────
export const useLoyaltyRedemptions = () => {
    const qc = useQueryClient();
    const actor = useActor();

    const { data: redemptions = [], isLoading, refetch } = useQuery({
        queryKey: ['loyalty-redemptions'],
        queryFn: loyaltyRedemptionsApi.getAll,
    });

    const { mutateAsync: redeemPrize, isPending: isRedeeming } = useMutation({
        mutationFn: (data: { clientId: string, prizeId: string }) => loyaltyRedemptionsApi.redeem(data),
        onSuccess: (redemption) => {
            logAction({ ...actor, action: 'LOYALTY_REDEMPTION', module: 'loyalty', detail: `El cliente (${redemption.clientId}) canjeó el premio: ${redemption.prizeName} por ${redemption.pointsUsed} puntos.` });
            qc.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
            qc.invalidateQueries({ queryKey: ['rewards'] });
            qc.invalidateQueries({ queryKey: ['client-rewards'] });
        },
    });

    return { redemptions, isLoading, refetch, redeemPrize, isRedeeming };
};

export const useLoyaltyHistory = (clientId: string | null) => {
    return useQuery({
        queryKey: ['loyalty-history', clientId],
        queryFn: () => loyaltyRedemptionsApi.getHistory(clientId!),
        enabled: !!clientId,
    });
};
