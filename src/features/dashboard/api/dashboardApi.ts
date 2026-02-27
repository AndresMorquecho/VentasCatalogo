
import type { DashboardData } from '../model/types';
import { orderApi } from '@/entities/order/model/api';
import { financialRecordApi } from '@/entities/financial-record/model/api';
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
        const [orders, financialRecords, clients, rewards] = await Promise.all([
            orderApi.getAll(),
            financialRecordApi.getAll(),
            clientApi.getAll(),
            rewardsApi.getAll()
        ]);

        return dashboardApi.processData(orders, financialRecords, clients, rewards);
    },

    processData: (orders: any[] = [], financialRecords: any[] = [], clients: any[] = [], rewards: any[] = []): DashboardData => {
        try {
            // Ensure we have arrays
            const safeOrders = Array.isArray(orders) ? orders : [];
            const safeFinancialRecords = Array.isArray(financialRecords) ? financialRecords : [];
            const safeClients = Array.isArray(clients) ? clients : [];
            const safeRewards = Array.isArray(rewards) ? rewards : [];

            // Get today's date
            const today = new Date().toISOString().split('T')[0];
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

            // ─── FINANCIAL METRICS ───────────────────────────────────────────────
            const todayRecords = safeFinancialRecords.filter(m => m.createdAt?.startsWith(today));
            const monthRecords = safeFinancialRecords.filter(m => m.createdAt?.startsWith(currentMonth));

            const dailyIncome = todayRecords
                .filter(m => m.movementType === 'INCOME')
                .reduce((sum, m) => sum + (m.amount || 0), 0);

            const monthlyIncome = monthRecords
                .filter(m => m.movementType === 'INCOME')
                .reduce((sum, m) => sum + (m.amount || 0), 0);

            const dailyAbonos = todayRecords
                .filter(m => m.source === 'ORDER_PAYMENT')
                .reduce((sum, m) => sum + (m.amount || 0), 0);

            // Calculate total portfolio pending
            const totalPortfolioPending = safeOrders
                .filter(o => o.status !== 'CANCELADO')
                .reduce((sum, o) => sum + getPendingAmount(o), 0);

            // Current cash
            const currentCash = safeFinancialRecords.reduce((sum, m) => {
                const amount = m.amount || 0;
                return sum + (m.movementType === 'INCOME' ? amount : -amount);
            }, 0);

            // ─── OPERATIONAL METRICS ─────────────────────────────────────────────
            const ordersReceivedToday = safeOrders.filter(o =>
                o.receptionDate && o.receptionDate.startsWith(today)
            ).length;

            const ordersPending = safeOrders.filter(o =>
                o.status === 'POR_RECIBIR'
            ).length;

            const ordersInWarehouse = safeOrders.filter(o =>
                o.status === 'RECIBIDO_EN_BODEGA'
            ).length;

            const ordersDeliveredToday = safeOrders.filter(o =>
                o.deliveryDate && o.deliveryDate.startsWith(today)
            ).length;

            const totalOrdersDelivered = safeOrders.filter(o =>
                o.status === 'ENTREGADO'
            ).length;

            const ordersByStatus = {
                porRecibir: safeOrders.filter(o => o.status === 'POR_RECIBIR').length,
                recepcionado: safeOrders.filter(o => o.status === 'RECIBIDO_EN_BODEGA').length,
                entregado: safeOrders.filter(o => o.status === 'ENTREGADO').length,
                cancelado: safeOrders.filter(o => o.status === 'CANCELADO').length
            };

            const totalActiveClients = safeClients.length;

            const warehouseTimes = safeOrders
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
            const ordersWithoutCall7Days = 0;
            const callsMadeToday = 0;
            const clientsWithoutRecentFollowup = 0;

            // ─── LOYALTY METRICS ─────────────────────────────────────────────────
            const pointsGeneratedThisMonth = safeRewards.reduce((sum, r) => sum + (r.totalRewardPoints || 0), 0);
            const topClients = [...safeRewards]
                .sort((a, b) => (Number(b.totalRewardPoints) || 0) - (Number(a.totalRewardPoints) || 0))
                .slice(0, 3)
                .map(r => {
                    const client = safeClients.find(c => c.id === r.clientId);
                    return {
                        name: client?.firstName || 'Cliente Desconocido',
                        points: Number(r.totalRewardPoints) || 0
                    };
                });

            // ─── CRITICAL ALERTS ─────────────────────────────────────────────────
            const now = new Date();
            const ordersWithDays = safeOrders
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

            const oldestOrders = ordersWithDays
                .filter(o => o.days > 15)
                .sort((a, b) => b.days - a.days)
                .slice(0, 5)
                .map(o => ({
                    id: o.order.receiptNumber,
                    clientName: o.order.clientName,
                    days: o.days,
                    value: getEffectiveTotal(o.order)
                }));

            // ─── CHARTS DATA ─────────────────────────────────────────────────────
            const salesTrend = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dateStr = date.toISOString().split('T')[0];
                const dayRecords = safeFinancialRecords.filter(m => m.createdAt?.startsWith(dateStr) && m.movementType === 'INCOME');
                const amount = dayRecords.reduce((sum, m) => sum + (m.amount || 0), 0);
                return {
                    date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
                    amount
                };
            });

            const orderStatus = [
                { status: 'Por Recibir', count: ordersByStatus.porRecibir, color: '#F59E0B' },
                { status: 'En Bodega', count: ordersByStatus.recepcionado, color: '#3B82F6' },
                { status: 'Entregado', count: ordersByStatus.entregado, color: '#10B981' },
                { status: 'Cancelado', count: ordersByStatus.cancelado, color: '#EF4444' }
            ];

            // ─── ORDERS TREND (DAILY: 7 days, WEEKLY: 4 weeks, MONTHLY: 6 months) ───
            const daily: any[] = [];
            for (let i = 6; i >= 0; i--) {
                const start = new Date(now);
                start.setDate(start.getDate() - i);
                start.setHours(0, 0, 0, 0);

                const end = new Date(start);
                end.setHours(23, 59, 59, 999);

                daily.push({
                    period: `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}`,
                    created: safeOrders.filter(o => o.createdAt && new Date(o.createdAt) >= start && new Date(o.createdAt) <= end).length,
                    delivered: safeOrders.filter(o => o.deliveryDate && new Date(o.deliveryDate) >= start && new Date(o.deliveryDate) <= end).length
                });
            }

            const weekly: any[] = [];
            for (let i = 3; i >= 0; i--) {
                const start = new Date(now);
                start.setDate(start.getDate() - (start.getDay() || 7) + 1 - (i * 7));
                start.setHours(0, 0, 0, 0);

                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);

                weekly.push({
                    period: `Sem ${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}`,
                    created: safeOrders.filter(o => o.createdAt && new Date(o.createdAt) >= start && new Date(o.createdAt) <= end).length,
                    delivered: safeOrders.filter(o => o.deliveryDate && new Date(o.deliveryDate) >= start && new Date(o.deliveryDate) <= end).length
                });
            }

            const monthly: any[] = [];
            for (let i = 5; i >= 0; i--) {
                const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
                const monthName = start.toLocaleString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase();

                monthly.push({
                    period: monthName,
                    created: safeOrders.filter(o => o.createdAt && new Date(o.createdAt) >= start && new Date(o.createdAt) <= end).length,
                    delivered: safeOrders.filter(o => o.deliveryDate && new Date(o.deliveryDate) >= start && new Date(o.deliveryDate) <= end).length
                });
            }

            return {
                financial: {
                    dailyIncome,
                    monthlyIncome,
                    dailyAbonos,
                    totalPortfolioPending,
                    overduePortfolioPercentage: 0,
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
                    redemptionsMade: 0
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
                    ordersTrend: {
                        daily,
                        weekly,
                        monthly
                    }
                }
            };
        } catch (error) {
            console.error("Dashboard processing error:", error);
            // Return empty but valid structure to avoid UI crashes
            return {
                financial: { dailyIncome: 0, monthlyIncome: 0, dailyAbonos: 0, totalPortfolioPending: 0, overduePortfolioPercentage: 0, currentCash: 0 },
                operational: { ordersReceivedToday: 0, ordersPending: 0, ordersInWarehouse: 0, ordersDeliveredToday: 0, totalOrdersDelivered: 0, totalActiveClients: 0, ordersByStatus: { porRecibir: 0, recepcionado: 0, entregado: 0, cancelado: 0 }, averageWarehouseTimeDays: 0 },
                tracking: { ordersWithoutCall7Days: 0, callsMadeToday: 0, clientsWithoutRecentFollowup: 0 },
                loyalty: { pointsGeneratedThisMonth: 0, topClients: [], redemptionsMade: 0 },
                alerts: { ordersOver15Days: 0, ordersOver30Days: 0, totalRetainedValue: 0, oldestOrders: [] },
                charts: { salesTrend: [], orderStatus: [], warehouseTimeTrend: [], comparison: { category: 'Finanzas', value1: 0, value2: 0 }, ordersTrend: { daily: [], weekly: [], monthly: [] } }
            };
        }
    }
};
