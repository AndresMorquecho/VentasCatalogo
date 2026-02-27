
// Financial Metrics
export type FinancialMetrics = {
    dailyIncome: number;
    monthlyIncome: number;
    dailyAbonos: number;
    totalPortfolioPending: number;
    overduePortfolioPercentage: number;
    currentCash: number;
};

// Operational Metrics
export type OperationalMetrics = {
    ordersReceivedToday: number;
    ordersPending: number;
    ordersInWarehouse: number;
    ordersDeliveredToday: number;
    totalOrdersDelivered: number;
    totalActiveClients: number;
    ordersByStatus: {
        porRecibir: number;
        recepcionado: number;
        entregado: number;
        cancelado: number;
    };
    averageWarehouseTimeDays: number;
};

// Tracking Metrics
export type TrackingMetrics = {
    ordersWithoutCall7Days: number;
    callsMadeToday: number;
    clientsWithoutRecentFollowup: number;
};

// Loyalty Metrics
export type LoyaltyMetrics = {
    pointsGeneratedThisMonth: number;
    topClients: { name: string; points: number }[];
    redemptionsMade: number;
};

// Critical Alerts
export type WarehouseAlerts = {
    ordersOver15Days: number;
    ordersOver30Days: number;
    totalRetainedValue: number;
    oldestOrders: { id: string; clientName: string; days: number; value: number }[];
};

// Charts Data
export type SalesTrendData = {
    date: string;
    amount: number;
};

export type OrderStatusData = {
    status: string;
    count: number;
    color: string;
};

export type WarehouseTimeTrendData = {
    month: string;
    days: number;
};

export type ComparisonChartData = {
    category: string;
    value1: number;
    value2: number;
};

export type OrdersTrendData = {
    period: string;
    created: number;
    delivered: number;
};

export type DashboardData = {
    financial: FinancialMetrics;
    operational: OperationalMetrics;
    tracking: TrackingMetrics;
    loyalty: LoyaltyMetrics;
    alerts: WarehouseAlerts;
    charts: {
        salesTrend: SalesTrendData[];
        orderStatus: OrderStatusData[];
        warehouseTimeTrend: WarehouseTimeTrendData[];
        comparison: ComparisonChartData;
        ordersTrend: {
            daily: OrdersTrendData[];
            weekly: OrdersTrendData[];
            monthly: OrdersTrendData[];
        };
    };
};
