
// ─── Loyalty Rule ─────────────────────────────────────────────────────────────
export type RuleType = 'POR_MONTO' | 'POR_PEDIDO' | 'BONO_ESPECIAL';

export type LoyaltyRule = {
    id: string;
    name: string;
    type: RuleType;
    pointsValue: number;        // points awarded per unit ($ or order)
    condition: string;          // e.g. "min $50", "every order"
    active: boolean;
    createdAt: string;
};

// ─── Loyalty Prize ────────────────────────────────────────────────────────────
export type PrizeType = 'DESCUENTO_PORCENTAJE' | 'ENVIO_GRATIS' | 'DESCUENTO_FIJO' | 'PEDIDO_ESPECIAL';

export type LoyaltyPrize = {
    id: string;
    name: string;
    description: string;
    type: PrizeType;
    pointsRequired: number;
    active: boolean;
    createdAt: string;
};

// ─── Redemption ───────────────────────────────────────────────────────────────
export type RedemptionStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';

export type LoyaltyRedemption = {
    id: string;
    clientId: string;
    clientName: string;
    prizeId: string;
    prizeName: string;
    pointsUsed: number;
    date: string;
    status: RedemptionStatus;
};

// ─── Form DTOs ────────────────────────────────────────────────────────────────
export type LoyaltyRuleFormData = Omit<LoyaltyRule, 'id' | 'createdAt'>;
export type LoyaltyPrizeFormData = Omit<LoyaltyPrize, 'id' | 'createdAt'>;
