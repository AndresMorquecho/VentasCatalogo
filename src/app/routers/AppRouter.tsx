import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { MainLayout } from '@/widgets/Layout'
import OrdersPage from '@/pages/orders-page/OrdersPage'
import { BrandsPage } from '@/pages/brands-page'
import { BankAccountsPage } from '@/pages/bank-accounts-page'
import { ClientsPage } from '@/pages/clients-page'
import { FinancialDashboardPage } from '@/features/financial-dashboard'
import { FinancialAuditPage } from '@/features/financial-audit'
import { OrderReceptionHistoryPage } from '@/features/order-reception'
import { InventoryPage } from "@/features/inventory/ui/InventoryPage"
import { ReceptionBatchPage } from '@/features/reception-batch'
import { OrderDeliveryPage, OrderDeliveryHistoryPage } from '@/features/order-delivery'
import { CashClosurePage } from '@/features/cash-closure/ui/CashClosurePage'
import { TransactionsPage } from '@/features/transactions'
import { PaymentsPage } from '@/features/payments/ui/PaymentsPage'
import { ClientCreditsPage } from '@/features/client-credits/ui/ClientCreditsPage'
import { CallsPage } from '@/features/calls'
import { LoyaltyPage } from '@/features/loyalty'
import { AdminUsersPage } from '@/features/users'
import { LoginPage } from '@/features/auth/ui/LoginPage'
import { DashboardPage } from '@/features/dashboard/ui/DashboardPage'
import { ProtectedRoute } from '@/shared/auth'
import { ToastProvider } from '@/shared/ui/use-toast'

const protectedChildren = [
    { index: true, element: <DashboardPage /> },
    { path: 'transactions', element: <ProtectedRoute permission="transactions.view"><TransactionsPage /></ProtectedRoute> },
    { path: 'orders', element: <ProtectedRoute permission="orders.view"><OrdersPage /></ProtectedRoute> },
    { path: 'orders/reception', element: <ProtectedRoute permission="reception.view"><ReceptionBatchPage /></ProtectedRoute> },
    { path: 'orders/reception/history', element: <ProtectedRoute permission="reception.view"><OrderReceptionHistoryPage /></ProtectedRoute> },
    { path: 'orders/delivery', element: <ProtectedRoute permission="delivery.view"><OrderDeliveryPage /></ProtectedRoute> },
    { path: 'orders/delivery/history', element: <ProtectedRoute permission="delivery.view"><OrderDeliveryHistoryPage /></ProtectedRoute> },
    { path: 'brands', element: <ProtectedRoute permission="brands.view"><BrandsPage /></ProtectedRoute> },
    { path: 'bank-accounts', element: <ProtectedRoute permission="bank_accounts.view"><BankAccountsPage /></ProtectedRoute> },
    { path: 'clients', element: <ProtectedRoute permission="clients.view"><ClientsPage /></ProtectedRoute> },
    { path: 'inventory', element: <ProtectedRoute permission="inventory.view"><InventoryPage /></ProtectedRoute> },
    { path: 'dashboard/financiero', element: <ProtectedRoute adminOnly><FinancialDashboardPage /></ProtectedRoute> },
    { path: 'auditoria/financiera', element: <ProtectedRoute adminOnly><FinancialAuditPage /></ProtectedRoute> },
    { path: 'cash-closure', element: <ProtectedRoute permission="cash_closure.view"><CashClosurePage /></ProtectedRoute> },
    { path: 'payments', element: <ProtectedRoute permission="payments.view"><PaymentsPage /></ProtectedRoute> },
    { path: 'client-credits', element: <ProtectedRoute permission="clients.view"><ClientCreditsPage /></ProtectedRoute> },
    { path: 'calls', element: <ProtectedRoute permission="calls.view"><CallsPage /></ProtectedRoute> },
    { path: 'rewards', element: <ProtectedRoute permission="loyalty.view"><LoyaltyPage /></ProtectedRoute> },
    {
        path: 'admin/users',
        element: <ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>,
    },
];

const router = createBrowserRouter([
    // ── Public routes ────────────────────────────────────────────────────────
    {
        path: '/login',
        element: <LoginPage />,
    },

    // ── Protected app shell ──────────────────────────────────────────────────
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: protectedChildren,
    },

    // ── Catch-all ────────────────────────────────────────────────────────────
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
])

export function AppRouter() {
    return (
        <ToastProvider>
            <RouterProvider router={router} />
        </ToastProvider>
    )
}
