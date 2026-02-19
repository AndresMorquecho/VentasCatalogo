
import type {
    LoyaltyRule, LoyaltyPrize, LoyaltyRedemption,
    LoyaltyRuleFormData, LoyaltyPrizeFormData
} from '../model/types';

// ─── Mock Storage (replace with API calls to your backend) ───────────────────
let RULES: LoyaltyRule[] = [
    {
        id: 'rule-1',
        name: 'Puntos por Monto',
        type: 'POR_MONTO',
        pointsValue: 1,
        condition: 'Por cada $1 gastado',
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: 'rule-2',
        name: 'Bono por Pedido Completado',
        type: 'POR_PEDIDO',
        pointsValue: 10,
        condition: 'Por cada pedido entregado',
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
    },
];

let PRIZES: LoyaltyPrize[] = [
    {
        id: 'prize-1',
        name: 'Envío Gratis',
        description: 'Envío sin costo en tu próximo pedido',
        type: 'ENVIO_GRATIS',
        pointsRequired: 100,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: 'prize-2',
        name: 'Descuento 10%',
        description: '10% de descuento sobre el total del pedido',
        type: 'DESCUENTO_PORCENTAJE',
        pointsRequired: 200,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
    },
];

const REDEMPTIONS: LoyaltyRedemption[] = [
    {
        id: 'red-1',
        clientId: 'c1',
        clientName: 'Ana García',
        prizeId: 'prize-1',
        prizeName: 'Envío Gratis',
        pointsUsed: 100,
        date: '2026-02-10T14:00:00Z',
        status: 'COMPLETADO',
    },
    {
        id: 'red-2',
        clientId: 'c2',
        clientName: 'María Pérez',
        prizeId: 'prize-2',
        prizeName: 'Descuento 10%',
        pointsUsed: 200,
        date: '2026-02-15T10:00:00Z',
        status: 'PENDIENTE',
    },
];

const delay = () => new Promise<void>(res => setTimeout(res, 300));

// ─── Rules API ────────────────────────────────────────────────────────────────
export const loyaltyRulesApi = {
    getAll: async (): Promise<LoyaltyRule[]> => {
        await delay();
        return [...RULES];
    },
    create: async (data: LoyaltyRuleFormData): Promise<LoyaltyRule> => {
        await delay();
        const rule: LoyaltyRule = { ...data, id: `rule-${Date.now()}`, createdAt: new Date().toISOString() };
        RULES = [...RULES, rule];
        return rule;
    },
    update: async (id: string, data: Partial<LoyaltyRuleFormData>): Promise<LoyaltyRule> => {
        await delay();
        RULES = RULES.map(r => r.id === id ? { ...r, ...data } : r);
        const updated = RULES.find(r => r.id === id);
        if (!updated) throw new Error('Rule not found');
        return updated;
    },
    remove: async (id: string): Promise<void> => {
        await delay();
        RULES = RULES.filter(r => r.id !== id);
    },
    toggle: async (id: string): Promise<LoyaltyRule> => {
        await delay();
        RULES = RULES.map(r => r.id === id ? { ...r, active: !r.active } : r);
        const updated = RULES.find(r => r.id === id);
        if (!updated) throw new Error('Rule not found');
        return updated;
    },
};

// ─── Prizes API ───────────────────────────────────────────────────────────────
export const loyaltyPrizesApi = {
    getAll: async (): Promise<LoyaltyPrize[]> => {
        await delay();
        return [...PRIZES];
    },
    create: async (data: LoyaltyPrizeFormData): Promise<LoyaltyPrize> => {
        await delay();
        const prize: LoyaltyPrize = { ...data, id: `prize-${Date.now()}`, createdAt: new Date().toISOString() };
        PRIZES = [...PRIZES, prize];
        return prize;
    },
    update: async (id: string, data: Partial<LoyaltyPrizeFormData>): Promise<LoyaltyPrize> => {
        await delay();
        PRIZES = PRIZES.map(p => p.id === id ? { ...p, ...data } : p);
        const updated = PRIZES.find(p => p.id === id);
        if (!updated) throw new Error('Prize not found');
        return updated;
    },
    remove: async (id: string): Promise<void> => {
        await delay();
        PRIZES = PRIZES.filter(p => p.id !== id);
    },
    toggle: async (id: string): Promise<LoyaltyPrize> => {
        await delay();
        PRIZES = PRIZES.map(p => p.id === id ? { ...p, active: !p.active } : p);
        const updated = PRIZES.find(p => p.id === id);
        if (!updated) throw new Error('Prize not found');
        return updated;
    },
};

// ─── Redemptions API ──────────────────────────────────────────────────────────
export const loyaltyRedemptionsApi = {
    getAll: async (): Promise<LoyaltyRedemption[]> => {
        await delay();
        return [...REDEMPTIONS];
    },
};
