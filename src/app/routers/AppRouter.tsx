
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
import { CallsPage } from '@/features/calls'
import { LoyaltyPage } from '@/features/loyalty'
import { AdminUsersPage } from '@/features/users'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard/ui/DashboardPage'
import { ProtectedRoute } from '@/shared/auth'
import { ToastProvider } from '@/shared/ui/use-toast'

// ─── All app routes wrapped in MainLayout and ProtectedRoute ─────────────────
// Any unauthenticated access → ProtectedRoute redirects to /login
const protectedChildren = [
    { index: true, element: <DashboardPage /> },
    { path: 'transactions', element: <TransactionsPage /> },
    { path: 'orders', element: <OrdersPage /> },
    { path: 'orders/reception', element: <ReceptionBatchPage /> },
    { path: 'orders/reception/history', element: <OrderReceptionHistoryPage /> },
    { path: 'orders/delivery', element: <OrderDeliveryPage /> },
    { path: 'orders/delivery/history', element: <OrderDeliveryHistoryPage /> },
    { path: 'brands', element: <BrandsPage /> },
    { path: 'bank-accounts', element: <BankAccountsPage /> },
    { path: 'clients', element: <ClientsPage /> },
    { path: 'inventory', element: <InventoryPage /> },
    { path: 'dashboard/financiero', element: <FinancialDashboardPage /> },
    { path: 'auditoria/financiera', element: <FinancialAuditPage /> },
    { path: 'cash-closure', element: <CashClosurePage /> },
    { path: 'payments', element: <PaymentsPage /> },
    { path: 'calls', element: <CallsPage /> },
    { path: 'rewards', element: <LoyaltyPage /> },
    {
        path: 'admin/users',
        element: (
            <ProtectedRoute adminOnly>
                <AdminUsersPage />
            </ProtectedRoute>
        ),
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
