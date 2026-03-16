import { Suspense, lazy } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { MainLayout } from '@/widgets/Layout'
import { ProtectedRoute } from '@/shared/auth'
import { ToastProvider } from '@/shared/ui/use-toast'

// Lazy loaded components
const DashboardPage = lazy(() => import('@/features/dashboard/ui/DashboardPage').then(m => ({ default: m.DashboardPage })));
const OrdersPage = lazy(() => import('@/pages/orders-page/OrdersPage'));
const BrandsPage = lazy(() => import('@/pages/brands-page').then(m => ({ default: m.BrandsPage })));
const BankAccountsPage = lazy(() => import('@/pages/bank-accounts-page').then(m => ({ default: m.BankAccountsPage })));
const ClientsPage = lazy(() => import('@/pages/clients-page').then(m => ({ default: m.ClientsPage })));
const FinancialDashboardPage = lazy(() => import('@/features/financial-dashboard').then(m => ({ default: m.FinancialDashboardPage })));
const FinancialAuditPage = lazy(() => import('@/features/financial-audit').then(m => ({ default: m.FinancialAuditPage })));
const OrderReceptionHistoryPage = lazy(() => import('@/features/order-reception').then(m => ({ default: m.OrderReceptionHistoryPage })));
const InventoryPage = lazy(() => import("@/features/inventory/ui/InventoryPage").then(m => ({ default: m.InventoryPage })));
const ReceptionBatchPage = lazy(() => import('@/features/reception-batch').then(m => ({ default: m.ReceptionBatchPage })));
const OrderDeliveryPage = lazy(() => import('@/features/order-delivery').then(m => ({ default: m.OrderDeliveryPage })));
const OrderDeliveryHistoryPage = lazy(() => import('@/features/order-delivery').then(m => ({ default: m.OrderDeliveryHistoryPage })));
const CashClosurePage = lazy(() => import('@/features/cash-closure/ui/CashClosurePage').then(m => ({ default: m.CashClosurePage })));
const TransactionsPage = lazy(() => import('@/features/transactions').then(m => ({ default: m.TransactionsPage })));
const PaymentsPage = lazy(() => import('@/features/payments/ui/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const WalletPage = lazy(() => import('@/features/wallet/ui/ClientCreditsPage').then(m => ({ default: m.ClientCreditsPage })));
const WalletValidationPage = lazy(() => import('@/features/wallet-validations/ui/WalletValidationPage').then(m => ({ default: m.WalletValidationPage })));
const CallsPage = lazy(() => import('@/features/calls').then(m => ({ default: m.CallsPage })));
const LoyaltyPage = lazy(() => import('@/features/loyalty').then(m => ({ default: m.LoyaltyPage })));
const AdminUsersPage = lazy(() => import('@/features/users').then(m => ({ default: m.AdminUsersPage })));
const LoginPage = lazy(() => import('@/features/auth/ui/LoginPage').then(m => ({ default: m.LoginPage })));
const OrderFormPage = lazy(() => import('@/features/order-management/ui/OrderFormPage').then(m => ({ default: m.OrderFormPage })));

// Loading Component
const PageLoader = () => (
    <div className="min-h-screen bg-white flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 border-r-2" />
            <p className="text-slate-500 font-bold animate-pulse">Cargando...</p>
        </div>
    </div>
);

const protectedChildren = [
    { index: true, element: <DashboardPage /> },
    { path: 'transactions', element: <ProtectedRoute permission="transactions.view"><TransactionsPage /></ProtectedRoute> },
    { path: 'orders', element: <ProtectedRoute permission="orders.view"><OrdersPage /></ProtectedRoute> },
    { path: 'orders/new', element: <ProtectedRoute permission="orders.create"><OrderFormPage /></ProtectedRoute> },
    { path: 'orders/edit/:id', element: <ProtectedRoute permission="orders.edit"><OrderFormPage /></ProtectedRoute> },
    { path: 'orders/group/:receiptNumber', element: <ProtectedRoute permission="orders.edit"><OrderFormPage /></ProtectedRoute> },
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
    { path: 'wallet', element: <ProtectedRoute permission="clients.view"><WalletPage /></ProtectedRoute> },
    { path: 'wallet-validations', element: <ProtectedRoute adminOnly><WalletValidationPage /></ProtectedRoute> },
    { path: 'wallet/validation', element: <Navigate to="/wallet-validations" replace /> },
    { path: 'client-credits', element: <Navigate to="/wallet" replace /> },
    { path: 'calls', element: <ProtectedRoute permission="calls.view"><CallsPage /></ProtectedRoute> },
    { path: 'rewards', element: <ProtectedRoute permission="loyalty.view"><LoyaltyPage /></ProtectedRoute> },
    {
        path: 'admin/users',
        element: <ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>,
    },
];

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: protectedChildren,
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
])

export function AppRouter() {
    return (
        <ToastProvider>
            <Suspense fallback={<PageLoader />}>
                <RouterProvider router={router} />
            </Suspense>
        </ToastProvider>
    )
}
