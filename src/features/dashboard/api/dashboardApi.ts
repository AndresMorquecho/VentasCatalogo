
import type { DashboardData } from '../model/types';

// Mock Data Service simulating backend aggregation
export const dashboardApi = {
    getDashboardMetrics: async (startDate?: string, endDate?: string): Promise<DashboardData> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));

        console.log(`Fetching dashboard data for range: ${startDate} to ${endDate}`);

        return {
            financial: {
                dailyIncome: 450.00,
                monthlyIncome: 12500.00,
                dailyAbonos: 120.00,
                totalPortfolioPending: 3200.00,
                overduePortfolioPercentage: 15,
                currentCash: 850.00
            },
            operational: {
                ordersReceivedToday: 5,
                ordersPending: 12,
                ordersInWarehouse: 8,
                ordersDeliveredToday: 3,
                averageWarehouseTimeDays: 4.5
            },
            tracking: {
                ordersWithoutCall7Days: 2,
                callsMadeToday: 8,
                clientsWithoutRecentFollowup: 5
            },
            loyalty: {
                pointsGeneratedThisMonth: 1250,
                topClients: [
                    { name: 'Ana Garcia', points: 300 },
                    { name: 'Maria Perez', points: 250 },
                    { name: 'Sofia Lopez', points: 180 }
                ],
                redemptionsMade: 4
            },
            alerts: {
                ordersOver15Days: 3,
                ordersOver30Days: 1,
                totalRetainedValue: 580.00,
                oldestOrders: [
                    { id: 'ORD-001', clientName: 'Juan Perez', days: 32, value: 120 },
                    { id: 'ORD-005', clientName: 'Luisa Gomez', days: 18, value: 85 }
                ]
            },
            charts: {
                salesTrend: [
                    { date: '01/02', amount: 120 },
                    { date: '02/02', amount: 300 },
                    { date: '03/02', amount: 250 },
                    { date: '04/02', amount: 400 },
                    { date: '05/02', amount: 150 },
                    { date: '06/02', amount: 500 },
                    { date: '07/02', amount: 320 }
                ],
                orderStatus: [
                    { status: 'Por Recibir', count: 12, color: '#F59E0B' },
                    { status: 'En Bodega', count: 8, color: '#3B82F6' },
                    { status: 'Entregado', count: 45, color: '#10B981' },
                    { status: 'Cancelado', count: 2, color: '#EF4444' }
                ],
                warehouseTimeTrend: [
                    { month: 'Ene', days: 5.2 },
                    { month: 'Feb', days: 4.8 },
                    { month: 'Mar', days: 4.5 }
                ],
                comparison: {
                    category: 'Finanzas',
                    value1: 12500.00,
                    value2: 3200.00
                },
                weeklyFlow: [
                    { week: 'Semana 1', created: 12, delivered: 8 },
                    { week: 'Semana 2', created: 18, delivered: 12 },
                    { week: 'Semana 3', created: 15, delivered: 18 },
                    { week: 'Semana 4', created: 22, delivered: 20 },
                ]
            }
        };
    }
};
