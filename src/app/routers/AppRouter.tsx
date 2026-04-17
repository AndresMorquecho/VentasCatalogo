import { Suspense, lazy } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { RefreshCw, AlertTriangle, Home } from 'lucide-react'
import { Button } from '@/shared/ui/button'
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
const PortfolioRecoveryPage = lazy(() => import('@/features/portfolio-recovery').then(m => ({ default: m.PortfolioRecoveryPage })));
const TransactionsPage = lazy(() => import('@/features/transactions').then(m => ({ default: m.TransactionsPage })));
const PaymentsPage = lazy(() => import('@/features/payments/ui/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const WalletPage = lazy(() => import('@/features/wallet/ui/ClientCreditsPage').then(m => ({ default: m.ClientCreditsPage })));
const WalletValidationPage = lazy(() => import('@/features/wallet-validations/ui/WalletValidationPage').then(m => ({ default: m.WalletValidationPage })));
const CallsPage = lazy(() => import('@/features/calls').then(m => ({ default: m.CallsPage })));
const ReactivationPage = lazy(() => import('@/features/calls').then(m => ({ default: m.ReactivationPage })));
const CollectionPage = lazy(() => import('@/features/calls').then(m => ({ default: m.CollectionPage })));
const CatalogsPage = lazy(() => import('@/features/catalogs').then(m => ({ default: m.CatalogsPage })));
const LoyaltyPage = lazy(() => import('@/features/loyalty').then(m => ({ default: m.LoyaltyPage })));
const AdminUsersPage = lazy(() => import('@/features/users').then(m => ({ default: m.AdminUsersPage })));
const ExchangesPage = lazy(() => import('@/features/exchanges/ui/ExchangesPage').then(m => ({ default: m.ExchangesPage })));
const NewExchangePage = lazy(() => import('@/features/exchanges/ui/NewExchangePage').then(m => ({ default: m.NewExchangePage })));
const ExchangesReceptionPage = lazy(() => import('@/features/exchanges/ui/ExchangesReceptionPage').then(m => ({ default: m.ExchangesReceptionPage })));
const ExchangesReceptionHistoryPage = lazy(() => import('@/features/exchanges/ui/ExchangesReceptionHistoryPage').then(m => ({ default: m.ExchangesReceptionHistoryPage })));
const ExchangesDeliveryPage = lazy(() => import('@/features/exchanges/ui/ExchangesDeliveryPage').then(m => ({ default: m.OrderDeliveryPage })));
const ExchangesShippingHistoryPage = lazy(() => import('@/features/exchanges/ui/ExchangesShippingHistoryPage').then(m => ({ default: m.ExchangesShippingHistoryPage })));
const LoginPage = lazy(() => import('@/features/auth/ui/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ui/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/ui/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const OrderFormPage = lazy(() => import('@/features/order-management/ui/OrderFormPage').then(m => ({ default: m.OrderFormPage })));
const SettingsPage = lazy(() => import('@/features/system-settings/ui/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Loading Component
const PageLoader = () => (
    <div className="min-h-screen bg-white flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 border-r-2" />
            <p className="text-slate-500 font-bold animate-pulse">Cargando...</p>
        </div>
    </div>
);

const RouterErrorBoundary = () => {
    const error = useRouteError();
    console.error('Router Error:', error);

    const isChunkLoadError = 
        (error instanceof Error && error.message.includes('Failed to fetch dynamically imported module')) ||
        (error instanceof TypeError && error.message.includes('Failed to fetch dynamically imported module'));

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">¡Ups! Algo salió mal</h2>
                    <p className="text-slate-500 text-sm font-medium">
                        {isChunkLoadError 
                            ? "Hubo un error al cargar una parte de la aplicación. Esto puede deberse a una actualización reciente o a un problema de conexión."
                            : "Ha ocurrido un error inesperado en la navegación."}
                    </p>
                </div>

                {isRouteErrorResponse(error) && (
                    <div className="bg-slate-50 p-4 rounded-2xl text-xs font-mono text-slate-400 text-left overflow-auto">
                        {error.status} {error.statusText}
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Button 
                        onClick={() => window.location.reload()} 
                        className="w-full bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black rounded-xl py-6"
                    >
                        <RefreshCw className="h-5 w-5 mr-3" />
                        Recargar Página
                    </Button>
                    
                    <Button 
                        variant="ghost"
                        onClick={() => window.location.href = '/'}
                        className="w-full text-slate-500 font-bold rounded-xl"
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Ir al Inicio
                    </Button>
                </div>
                
                <p className="text-[10px] text-slate-300 font-medium pt-4 border-t border-slate-50">
                    ID del Error: {Date.now().toString(36)}
                </p>
            </div>
        </div>
    );
};

const protectedChildren = [
    { index: true, element: <DashboardPage /> },
    { path: 'transactions', element: <ProtectedRoute permission="transactions.view"><TransactionsPage /></ProtectedRoute> },
    { path: 'orders', element: <ProtectedRoute permission="orders.view"><OrdersPage /></ProtectedRoute> },
    { path: 'orders/new', element: <ProtectedRoute permission="orders.create"><OrderFormPage /></ProtectedRoute> },
    { path: 'orders/edit/:id', element: <ProtectedRoute permission="orders.edit"><OrderFormPage /></ProtectedRoute> },
    { path: 'orders/group/:receiptNumber', element: <ProtectedRoute permission="orders.edit"><OrderFormPage /></ProtectedRoute> },
    { path: 'orders/reception', element: <ProtectedRoute permission="reception.view"><OrderReceptionHistoryPage /></ProtectedRoute> },
    { path: 'orders/reception/new', element: <ProtectedRoute permission="reception.confirm"><ReceptionBatchPage /></ProtectedRoute> },
    { path: 'orders/delivery', element: <ProtectedRoute permission="delivery.view"><OrderDeliveryPage /></ProtectedRoute> },
    { path: 'orders/delivery/history', element: <ProtectedRoute permission="delivery.view"><OrderDeliveryHistoryPage /></ProtectedRoute> },
    { path: 'brands', element: <ProtectedRoute permission="brands.view"><BrandsPage /></ProtectedRoute> },
    { path: 'bank-accounts', element: <ProtectedRoute permission="bank_accounts.view"><BankAccountsPage /></ProtectedRoute> },
    { path: 'clients', element: <ProtectedRoute permission="clients.view"><ClientsPage /></ProtectedRoute> },
    { path: 'inventory', element: <ProtectedRoute permission="inventory.view"><InventoryPage /></ProtectedRoute> },
    { path: 'dashboard/financiero', element: <ProtectedRoute adminOnly><FinancialDashboardPage /></ProtectedRoute> },
    { path: 'auditoria/financiera', element: <ProtectedRoute adminOnly><FinancialAuditPage /></ProtectedRoute> },
    { path: 'cash-closure', element: <ProtectedRoute permission="cash_closure.view"><CashClosurePage /></ProtectedRoute> },
    { path: 'cartera', element: <ProtectedRoute permission="cartera.view"><PortfolioRecoveryPage /></ProtectedRoute> },
    { path: 'payments', element: <ProtectedRoute permission="payments.view"><PaymentsPage /></ProtectedRoute> },
    { path: 'wallet', element: <ProtectedRoute permission="wallet.view"><WalletPage /></ProtectedRoute> },
    { path: 'wallet-validations', element: <ProtectedRoute permission="wallet_validations.view"><WalletValidationPage /></ProtectedRoute> },
    { path: 'wallet/validation', element: <Navigate to="/wallet-validations" replace /> },
    { path: 'client-credits', element: <Navigate to="/wallet" replace /> },
    { path: 'calls', element: <ProtectedRoute permission="calls.view"><CallsPage /></ProtectedRoute> },
    { path: 'calls/reactivation', element: <ProtectedRoute permission="calls.view"><ReactivationPage /></ProtectedRoute> },
    { path: 'calls/collection', element: <ProtectedRoute permission="calls.view"><CollectionPage /></ProtectedRoute> },
    { path: 'catalogs', element: <ProtectedRoute permission="catalogs.view"><CatalogsPage /></ProtectedRoute> },
    { path: 'rewards', element: <ProtectedRoute permission="loyalty.view"><LoyaltyPage /></ProtectedRoute> },
    { path: 'exchanges', element: <ProtectedRoute permission="exchanges.view"><ExchangesPage /></ProtectedRoute> },
    { path: 'exchanges/new', element: <ProtectedRoute permission="exchanges.create"><NewExchangePage /></ProtectedRoute> },
    { path: 'exchanges/edit/:id', element: <ProtectedRoute permission="exchanges.edit"><NewExchangePage /></ProtectedRoute> },
    { path: 'exchanges/group/:receiptNumber', element: <ProtectedRoute permission="exchanges.edit"><NewExchangePage /></ProtectedRoute> },
    { path: 'exchanges/reception', element: <ProtectedRoute permission="exchanges.view"><ExchangesReceptionPage /></ProtectedRoute> },
    { path: 'exchanges/reception-history', element: <ProtectedRoute permission="exchanges.view"><ExchangesReceptionHistoryPage /></ProtectedRoute> },
    { path: 'exchanges/delivery', element: <ProtectedRoute permission="exchanges.view"><ExchangesDeliveryPage /></ProtectedRoute> },
    { path: 'exchanges/shipping-history', element: <ProtectedRoute permission="exchanges.view"><ExchangesShippingHistoryPage /></ProtectedRoute> },
    {
        path: 'admin/users',
        element: <ProtectedRoute permission="users.view"><AdminUsersPage /></ProtectedRoute>,
    },
    {
        path: 'admin/settings',
        element: <ProtectedRoute permission="system_config.view"><SettingsPage /></ProtectedRoute>,
    },
];

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
    },
    {
        path: '/reset-password',
        element: <ResetPasswordPage />,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        errorElement: <RouterErrorBoundary />,
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
