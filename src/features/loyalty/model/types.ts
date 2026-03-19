// ─── Loyalty Rule ─────────────────────────────────────────────────────────────
export type RuleType = 'POR_MONTO' | 'POR_PEDIDOS';

export type LoyaltyRule = {
    id: string;
    name: string;
    description: string | null;
    type: RuleType;
    targetValue: number;
    resetDays: number | null;
    isActive: boolean;
    prizeId: string | null;
    brands: { brandId: string; brand: { name: string } }[];
    createdAt: string;
};

// ─── Loyalty Prize ────────────────────────────────────────────────────────────
export type PrizeType = 'DESCUENTO_PORCENTAJE' | 'ENVIO_GRATIS' | 'DESCUENTO_FIJO' | 'PEDIDO_ESPECIAL';

export type LoyaltyPrize = {
    id: string;
    name: string;
    description: string | null;
    type: PrizeType;
    pointsRequired: number | null;
    isActive: boolean;
    createdAt: string;
};

// ─── Balance & Progress ───────────────────────────────────────────────────────
export interface LoyaltyBalance {
    id: string;
    name: string;
    idNumber: string;
    rules: {
        ruleId: string;
        ruleName: string;
        prizeName: string | null;
        type: RuleType;
        progress: number;
        current: number;
        target: number;
        missing: number;
        expiringDays: number | null;
        canRedeem: boolean;
    }[];
}

// ─── Redemption ───────────────────────────────────────────────────────────────
export type RedemptionStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';

export type LoyaltyRedemption = {
    id: string;
    clientId: string;
    clientName: string;
    ruleId: string | null;
    prizeId: string;
    prizeName: string;
    pointsUsed: number | null;
    valueClaimed: number | null;
    date: string;
    status: RedemptionStatus;
    authorName?: string;
};

// ─── Form DTOs ────────────────────────────────────────────────────────────────
export type LoyaltyRuleFormData = {
    name: string;
    description: string | null;
    type: RuleType;
    targetValue: number;
    resetDays: number | null;
    isActive: boolean;
    prizeId: string | null;
    brandIds: string[];
};

export type LoyaltyPrizeFormData = Omit<LoyaltyPrize, 'id' | 'createdAt'>;
