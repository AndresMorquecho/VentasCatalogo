import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MainLayout } from '@/widgets/Layout'
import { HomePage } from '@/pages/home'
import OrdersPage from '@/pages/orders-page/OrdersPage'
import { BrandsPage } from '@/pages/brands-page'
import { BankAccountsPage } from '@/pages/bank-accounts-page'
import { FinancialDashboardPage } from '@/features/financial-dashboard'
import { FinancialAuditPage } from '@/features/financial-audit'
import { OrderReceptionPage, OrderReceptionHistoryPage } from '@/features/order-reception'
import { OrderDeliveryPage, OrderDeliveryHistoryPage } from '@/features/order-delivery'

const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'orders',
                element: <OrdersPage />,
            },
            {
                path: 'orders/reception',
                element: <OrderReceptionPage />,
            },
            {
                path: 'orders/reception/history',
                element: <OrderReceptionHistoryPage />,
            },
            {
                path: 'orders/delivery',
                element: <OrderDeliveryPage />,
            },
            {
                path: 'orders/delivery/history',
                element: <OrderDeliveryHistoryPage />,
            },
            {
                path: 'brands',
                element: <BrandsPage />,
            },
            {
                path: 'bank-accounts',
                element: <BankAccountsPage />,
            },
            {
                path: 'dashboard/financiero',
                element: <FinancialDashboardPage />,
            },
            {
                path: 'auditoria/financiera',
                element: <FinancialAuditPage />,
            }
        ],
    },
    // Public routes (login, register) can be added here
])

export function AppRouter() {
    return <RouterProvider router={router} />
}
