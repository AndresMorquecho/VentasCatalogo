
import type { Order } from '@/entities/order/model/types';
import type { ClientReward } from '@/entities/client-reward/model/types';

export const calculateRewardPoints = (order: Order): number => {
    let points = 0;

    // 1 punto por cada $10
    points += Math.floor(order.total / 10);

    // +5 puntos extra por pedido
    points += 5;

    // Bonus si paga completo
    // Using paidAmount from Order type
    if (order.paidAmount >= order.total) { // Check if paid amount covers total
        points += 10; // Bonus (value not specified, using 10 as example or derive further if clearer)
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
    const pointsEarned = calculateRewardPoints(order);
    const newTotalPoints = currentReward.totalPoints + pointsEarned;
    const newTotalOrders = currentReward.totalOrders + 1;
    const newTotalSpent = currentReward.totalSpent + order.total;

    return {
        ...currentReward,
        totalPoints: newTotalPoints,
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        level: calculateLevel(newTotalPoints),
        updatedAt: new Date().toISOString(),
    };
};
