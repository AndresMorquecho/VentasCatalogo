
export type RewardLevel = 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';

export type ClientReward = {
  id: string;
  clientId: string;
  totalRewardPoints: number;
  totalOrders: number;
  totalSpent: number;
  rewardLevel: RewardLevel;
  updatedAt: string;
  appliedOrderIds?: string[];
};

export type RewardType = 'ENVIO_GRATIS' | 'DESCUENTO_50' | 'PRODUCTO_GRATIS';

export type RewardRedemption = {
  id: string;
  clientId: string;
  pointsUsed: number;
  rewardType: RewardType;
  createdAt: string;
};
