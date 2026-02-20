
export type RewardLevel = 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';

export type ClientReward = {
  id: string;
  clientId: string;
  totalPoints: number;
  totalOrders: number;
  totalSpent: number;
  level: RewardLevel;
  updatedAt: string;
  // TODO BACKEND: Add appliedOrderIds: string[] to prevent duplicate point application
  appliedOrderIds?: string[]; // Track which orders already earned points
};

export type RewardType = 'ENVIO_GRATIS' | 'DESCUENTO_50' | 'PRODUCTO_GRATIS';

export type RewardRedemption = {
  id: string; // Unique ID for redemption
  clientId: string;
  pointsUsed: number;
  rewardType: RewardType;
  createdAt: string;
};
