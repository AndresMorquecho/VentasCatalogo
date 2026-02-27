
import type { Order } from '@/entities/order/model/types';
import type { ClientReward } from '@/entities/client-reward/model/types';
import { getPaidAmount, getEffectiveTotal } from '@/entities/order/model/model';

export const calculateRewardPoints = (order: Order): number => {
    let points = 0;

    // Use effective total (realInvoiceTotal if available, otherwise total)
    const effectiveTotal = getEffectiveTotal(order);

    // 1 punto por cada $10
    points += Math.floor(effectiveTotal / 10);

    // +5 puntos extra por pedido
    points += 5;

    // Bonus si paga completo
    const paidAmount = getPaidAmount(order);
    if (paidAmount >= effectiveTotal) {
        points += 10; // Bonus for full payment
    }

    return points;
};

export const calculateLevel = (points: number): 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO' => {
    if (points >= 600) return 'PLATINO';
    if (points >= 300) return 'ORO';
    if (points >= 100) return 'PLATA';
    return 'BRONCE';
};

export const updateClientRewards = (currentReward: ClientReward, order: Order): ClientReward => {
    // TODO BACKEND: Validate order hasn't been processed before
    // Prevent duplicate point application
    if (currentReward.appliedOrderIds?.includes(order.id)) {
        console.warn(`Reward points already applied for order ${order.id}, skipping`);
        return currentReward; // Return unchanged
    }

    const pointsEarned = calculateRewardPoints(order);
    const newTotalPoints = currentReward.totalRewardPoints + pointsEarned;
    const newTotalOrders = currentReward.totalOrders + 1;

    // Use effective total for spent calculation
    const effectiveTotal = getEffectiveTotal(order);
    const newTotalSpent = Number(currentReward.totalSpent) + effectiveTotal;

    return {
        ...currentReward,
        totalRewardPoints: newTotalPoints,
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        rewardLevel: calculateLevel(newTotalPoints),
        updatedAt: new Date().toISOString(),
        appliedOrderIds: [...(currentReward.appliedOrderIds || []), order.id]
    };
};
