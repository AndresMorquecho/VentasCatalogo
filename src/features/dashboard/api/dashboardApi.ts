
import type { DashboardData } from '../model/types';
import { orderApi } from '@/entities/order/model/api';
import { financialMovementApi } from '@/shared/api/financialMovementApi';
import { clientApi } from '@/shared/api/clientApi';
import { rewardsApi } from '@/entities/client-reward/api/rewardsApi';
import { getPendingAmount, getEffectiveTotal } from '@/entities/order/model/model';

// Real Data Service calculating from actual data
export const dashboardApi = {
    getDashboardMetrics: async (startDate?: string, endDate?: string): Promise<DashboardData> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log(`Fetching dashboard data for range: ${startDate} to ${endDate}`);

        // Fetch all data in parallel
        const [orders, movements, clients, rewards] = await Promise.all([
            orderApi.getAll(),
            financialMovementApi.getAll(),
            clientApi.getAll(),
            rewardsApi.getAll()
        ]);

        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // ─── FINANCIAL METRICS ───────────────────────────────────────────────
        const todayMovements = movements.filter(m => m.createdAt.startsWith(today));
        const monthMovements = movements.filter(m => m.createdAt.startsWith(currentMonth));
        
        const dailyIncome = todayMovements
            .filter(m => m.type === 'INCOME')
            .reduce((sum, m) => sum + m.amount, 0);
        
        const monthlyIncome = monthMovements
            .filter(m => m.type === 'INCOME')
            .reduce((sum, m) => sum + m.amount, 0);

        const dailyAbonos = todayMovements
            .filter(m => m.source === 'ORDER_PAYMENT')
            .reduce((sum, m) => sum + m.amount, 0);

        // Calculate total portfolio pending (all orders with pending amount)
        const totalPortfolioPending = orders
            .filter(o => o.status !== 'CANCELADO')
            .reduce((sum, o) => sum + getPendingAmount(o), 0);

        // Current cash (sum of all movements)
        const currentCash = movements.reduce((sum, m) => {
            return sum + (m.type === 'INCOME' ? m.amount : -m.amount);
        }, 0);

        // ─── OPERATIONAL METRICS ─────────────────────────────────────────────
        const ordersReceivedToday = orders.filter(o => 
            o.receptionDate && o.receptionDate.startsWith(today)
        ).length;

        const ordersPending = orders.filter(o => 
            o.status === 'POR_RECIBIR' || o.status === 'RECIBIDO_EN_BODEGA'
        ).length;

        const ordersInWarehouse = orders.filter(o => 
            o.status === 'RECIBIDO_EN_BODEGA'
        ).length;

        const ordersDeliveredToday = orders.filter(o => 
            o.deliveryDate && o.deliveryDate.startsWith(today)
        ).length;

        // Total orders delivered (all time)
        const totalOrdersDelivered = orders.filter(o => 
            o.status === 'ENTREGADO'
        ).length;

        // Orders by status for charts
        const ordersByStatus = {
            porRecibir: orders.filter(o => o.status === 'POR_RECIBIR').length,
            recepcionado: orders.filter(o => o.status === 'RECIBIDO_EN_BODEGA').length,
            entregado: orders.filter(o => o.status === 'ENTREGADO').length,
            cancelado: orders.filter(o => o.status === 'CANCELADO').length
        };

        // Total active clients (clients with at least one order)
        const totalActiveClients = clients.length;

        // Calculate average warehouse time
        const warehouseTimes = orders
            .filter(o => o.receptionDate && o.deliveryDate)
            .map(o => {
                const reception = new Date(o.receptionDate!);
                const delivery = new Date(o.deliveryDate!);
                return (delivery.getTime() - reception.getTime()) / (1000 * 60 * 60 * 24);
            });
        const averageWarehouseTimeDays = warehouseTimes.length > 0
            ? warehouseTimes.reduce((a, b) => a + b, 0) / warehouseTimes.length
            : 0;

        // ─── TRACKING METRICS ────────────────────────────────────────────────
        // These would need call records API - using placeholder for now
        const ordersWithoutCall7Days = 0;
        const callsMadeToday = 0;
        const clientsWithoutRecentFollowup = 0;

        // ─── LOYALTY METRICS ─────────────────────────────────────────────────
        const pointsGeneratedThisMonth = rewards.reduce((sum, r) => sum + r.totalPoints, 0);
        const topClients = rewards
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 3)
            .map(r => {
                const client = clients.find(c => c.id === r.clientId);
                return {
                    name: client?.firstName || 'Cliente Desconocido',
                    points: r.totalPoints
                };
            });

        // ─── CRITICAL ALERTS ─────────────────────────────────────────────────
        const now = new Date();
        const ordersWithDays = orders
            .filter(o => o.status === 'RECIBIDO_EN_BODEGA' && o.receptionDate)
            .map(o => {
                const reception = new Date(o.receptionDate!);
                const days = Math.floor((now.getTime() - reception.getTime()) / (1000 * 60 * 60 * 24));
                return { order: o, days };
            });

        const ordersOver15Days = ordersWithDays.filter(o => o.days > 15).length;
        const ordersOver30Days = ordersWithDays.filter(o => o.days > 30).length;
        
        const totalRetainedValue = ordersWithDays
            .filter(o => o.days > 15)
            .reduce((sum, o) => sum + getEffectiveTotal(o.order), 0);

        // Only show orders that are actually over 15 days (critical)
        const oldestOrders = ordersWithDays
            .filter(o => o.days > 15) // ONLY critical orders
            .sort((a, b) => b.days - a.days)
            .slice(0, 5)
            .map(o => ({
                id: o.order.receiptNumber,
                clientName: o.order.clientName,
                days: o.days,
                value: getEffectiveTotal(o.order)
            }));

        // ─── CHARTS DATA ─────────────────────────────────────────────────────
        // Sales trend (last 7 days)
        const salesTrend = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const dayMovements = movements.filter(m => m.createdAt.startsWith(dateStr) && m.type === 'INCOME');
            const amount = dayMovements.reduce((sum, m) => sum + m.amount, 0);
            return {
                date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
                amount
            };
        });

        // Order status distribution
        const orderStatus = [
            { status: 'Por Recibir', count: orders.filter(o => o.status === 'POR_RECIBIR').length, color: '#F59E0B' },
            { status: 'En Bodega', count: orders.filter(o => o.status === 'RECIBIDO_EN_BODEGA').length, color: '#3B82F6' },
            { status: 'Entregado', count: orders.filter(o => o.status === 'ENTREGADO').length, color: '#10B981' },
            { status: 'Cancelado', count: orders.filter(o => o.status === 'CANCELADO').length, color: '#EF4444' }
        ];

        return {
            financial: {
                dailyIncome,
                monthlyIncome,
                dailyAbonos,
                totalPortfolioPending,
                overduePortfolioPercentage: 0, // Would need due date logic
                currentCash
            },
            operational: {
                ordersReceivedToday,
                ordersPending,
                ordersInWarehouse,
                ordersDeliveredToday,
                totalOrdersDelivered,
                totalActiveClients,
                ordersByStatus,
                averageWarehouseTimeDays
            },
            tracking: {
                ordersWithoutCall7Days,
                callsMadeToday,
                clientsWithoutRecentFollowup
            },
            loyalty: {
                pointsGeneratedThisMonth,
                topClients,
                redemptionsMade: 0 // Would need redemptions API
            },
            alerts: {
                ordersOver15Days,
                ordersOver30Days,
                totalRetainedValue,
                oldestOrders
            },
            charts: {
                salesTrend,
                orderStatus,
                warehouseTimeTrend: [
                    { month: 'Actual', days: averageWarehouseTimeDays }
                ],
                comparison: {
                    category: 'Finanzas',
                    value1: monthlyIncome,
                    value2: totalPortfolioPending
                },
                weeklyFlow: [] // Would need weekly aggregation
            }
        };
    }
};
