/**
 * Centralized Query Keys for React Query
 * 
 * Benefits:
 * - Type-safe query keys
 * - Easy to invalidate related queries
 * - Consistent naming across the app
 * - Better refactoring support
 */

export const queryKeys = {
  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.clients.lists(), { filters }] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    credits: (id: string) => [...queryKeys.clients.detail(id), 'credits'] as const,
    account: (id: string) => [...queryKeys.clients.detail(id), 'account'] as const
  },

  // Brands
  brands: {
    all: ['brands'] as const,
    lists: () => [...queryKeys.brands.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.brands.lists(), { filters }] as const,
    details: () => [...queryKeys.brands.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.brands.details(), id] as const
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.orders.lists(), { filters }] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    payments: (id: string) => [...queryKeys.orders.detail(id), 'payments'] as const,
    byClient: (clientId: string) => [...queryKeys.orders.all, 'client', clientId] as const,
    byStatus: (status: string) => [...queryKeys.orders.all, 'status', status] as const
  },

  // Financial Records
  financialRecords: {
    all: ['financial-records'] as const,
    lists: () => [...queryKeys.financialRecords.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.financialRecords.lists(), { filters }] as const,
    details: () => [...queryKeys.financialRecords.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.financialRecords.details(), id] as const,
    byClient: (clientId: string) => [...queryKeys.financialRecords.all, 'client', clientId] as const,
    byOrder: (orderId: string) => [...queryKeys.financialRecords.all, 'order', orderId] as const,
    byDateRange: (startDate: string, endDate: string) => 
      [...queryKeys.financialRecords.all, 'date-range', startDate, endDate] as const
  },

  // Bank Accounts
  bankAccounts: {
    all: ['bank-accounts'] as const,
    lists: () => [...queryKeys.bankAccounts.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.bankAccounts.lists(), { filters }] as const,
    details: () => [...queryKeys.bankAccounts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bankAccounts.details(), id] as const,
    byType: (type: string) => [...queryKeys.bankAccounts.all, 'type', type] as const
  },

  // Cash Closures
  cashClosures: {
    all: ['cash-closures'] as const,
    lists: () => [...queryKeys.cashClosures.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.cashClosures.lists(), { filters }] as const,
    details: () => [...queryKeys.cashClosures.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cashClosures.details(), id] as const,
    byDate: (date: string) => [...queryKeys.cashClosures.all, 'date', date] as const
  },

  // Inventory
  inventory: {
    all: ['inventory'] as const,
    movements: () => [...queryKeys.inventory.all, 'movements'] as const,
    movement: (id: string) => [...queryKeys.inventory.movements(), id] as const,
    byOrder: (orderId: string) => [...queryKeys.inventory.all, 'order', orderId] as const,
    byBrand: (brandId: string) => [...queryKeys.inventory.all, 'brand', brandId] as const
  },

  // Calls
  calls: {
    all: ['calls'] as const,
    lists: () => [...queryKeys.calls.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.calls.lists(), { filters }] as const,
    details: () => [...queryKeys.calls.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.calls.details(), id] as const,
    byClient: (clientId: string) => [...queryKeys.calls.all, 'client', clientId] as const,
    byOrder: (orderId: string) => [...queryKeys.calls.all, 'order', orderId] as const
  },

  // Client Credits
  clientCredits: {
    all: ['client-credits'] as const,
    lists: () => [...queryKeys.clientCredits.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.clientCredits.lists(), { filters }] as const,
    details: () => [...queryKeys.clientCredits.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clientCredits.details(), id] as const,
    byClient: (clientId: string) => [...queryKeys.clientCredits.all, 'client', clientId] as const,
    available: (clientId: string) => [...queryKeys.clientCredits.byClient(clientId), 'available'] as const
  },

  // Rewards
  rewards: {
    all: ['rewards'] as const,
    byClient: (clientId: string) => [...queryKeys.rewards.all, 'client', clientId] as const
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentOrders: () => [...queryKeys.dashboard.all, 'recent-orders'] as const,
    pendingOrders: () => [...queryKeys.dashboard.all, 'pending-orders'] as const
  }
};
