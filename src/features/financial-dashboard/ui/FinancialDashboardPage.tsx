import { useFinancialDashboard } from '../model/useFinancialDashboard';
import { useBankAccountList } from '@/features/bank-account/api/hooks';
import { TrendingUp, TrendingDown, DollarSign, Building2, Wallet } from 'lucide-react';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

export function FinancialDashboardPage() {
    const { summary, loading, error } = useFinancialDashboard();
    const { data: bankAccounts = [] } = useBankAccountList();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Cargando dashboard financiero...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Error al cargar datos: {error.message}
            </div>
        );
    }

    const isProfit = summary.netBalance >= 0;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="border-b pb-4">
                <h1 className="text-3xl font-bold text-foreground">Dashboard Financiero</h1>
                <p className="text-muted-foreground mt-1">
                    Resumen general de ingresos, egresos y flujo de efectivo
                </p>
            </div>

            {/* Key Metrics - Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Income */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500 rounded-lg shadow-sm">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            INGRESOS
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-green-700 mb-1">
                        {formatCurrency(summary.totalIncome)}
                    </p>
                    <p className="text-sm text-green-600">
                        {summary.bySource.ORDER_PAYMENT.count + summary.bySource.MANUAL.count + summary.bySource.ADJUSTMENT.count} movimientos
                    </p>
                </div>

                {/* Total Expense */}
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-500 rounded-lg shadow-sm">
                            <TrendingDown className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                            EGRESOS
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-red-700 mb-1">
                        {formatCurrency(summary.totalExpense)}
                    </p>
                    <p className="text-sm text-red-600">
                        Gastos del periodo
                    </p>
                </div>

                {/* Net Balance */}
                <div className={`bg-gradient-to-br ${isProfit ? 'from-blue-50 to-indigo-50 border-blue-200' : 'from-amber-50 to-orange-50 border-amber-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 ${isProfit ? 'bg-blue-500' : 'bg-amber-500'} rounded-lg shadow-sm`}>
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <span className={`text-xs font-medium ${isProfit ? 'text-blue-700 bg-blue-100' : 'text-amber-700 bg-amber-100'} px-2 py-1 rounded-full`}>
                            BALANCE NETO
                        </span>
                    </div>
                    <p className={`text-3xl font-bold ${isProfit ? 'text-blue-700' : 'text-amber-700'} mb-1`}>
                        {formatCurrency(summary.netBalance)}
                    </p>
                    <p className={`text-sm ${isProfit ? 'text-blue-600' : 'text-amber-600'}`}>
                        {isProfit ? 'Superávit' : 'Déficit'}
                    </p>
                </div>
            </div>

            {/* Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Source */}
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b pb-3">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Desglose por Fuente</h2>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(summary.bySource).map(([source, data]) => (
                            <div key={source} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-sm capitalize">
                                        {source === 'ORDER_PAYMENT' ? 'Pagos de Órdenes' : source === 'MANUAL' ? 'Manual' : 'Ajuste'}
                                    </span>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        {data.count} mov.
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Ingresos</p>
                                        <p className="font-semibold text-green-600">{formatCurrency(data.income)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Egresos</p>
                                        <p className="font-semibold text-red-600">{formatCurrency(data.expense)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Bank Account */}
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b pb-3">
                        <Wallet className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Desglose por Cuenta</h2>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(summary.byBankAccount).map(([accountId, data]) => {
                            const account = bankAccounts.find(a => a.id === accountId);
                            const accountName = account?.name || 'Cuenta Desconocida';
                            const isPositive = data.balance >= 0;

                            return (
                                <div key={accountId} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-sm">{accountName}</span>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                            {data.count} mov.
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Ingreso</p>
                                            <p className="font-semibold text-green-600 text-xs">{formatCurrency(data.income)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Egreso</p>
                                            <p className="font-semibold text-red-600 text-xs">{formatCurrency(data.expense)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Balance</p>
                                            <p className={`font-bold text-xs ${isPositive ? 'text-blue-600' : 'text-amber-600'}`}>
                                                {formatCurrency(data.balance)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(summary.byBankAccount).length === 0 && (
                            <p className="text-center text-muted-foreground py-8 text-sm">
                                No hay movimientos registrados
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="bg-muted/20 border rounded-lg p-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Total de movimientos registrados
                </p>
                <p className="text-2xl font-bold text-primary">
                    {summary.movementCount}
                </p>
            </div>
        </div>
    );
}
