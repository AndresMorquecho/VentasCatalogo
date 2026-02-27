import { useFinancialAudit } from '../model/useFinancialAudit';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

export function FinancialAuditPage() {
    const { audits, totalDiscrepancies, loading, error } = useFinancialAudit();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Ejecutando auditoría financiera...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Error al cargar auditoría: {error.message}
            </div>
        );
    }

    const hasIssues = totalDiscrepancies > 0;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="border-b pb-4">
                <div className="space-y-1 sm:space-y-2 px-1 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Auditoría Financiera</h1>
                    <h2 className="text-base font-medium text-muted-foreground tracking-tight">Reconciliación de balances calculados vs reportados</h2>
                </div>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-xl border-2 ${hasIssues ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {hasIssues ? (
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        ) : (
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        )}
                        <div>
                            <h2 className={`text-xl font-bold ${hasIssues ? 'text-red-700' : 'text-green-700'}`}>
                                {hasIssues ? 'Discrepancias Detectadas' : 'Todas las Cuentas Cuadran'}
                            </h2>
                            <p className={`text-sm ${hasIssues ? 'text-red-600' : 'text-green-600'}`}>
                                {hasIssues
                                    ? `${totalDiscrepancies} cuenta(s) presentan diferencias`
                                    : 'Los balances calculados coinciden con los reportados'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Cuentas Auditadas</p>
                        <p className="text-3xl font-bold text-primary">{audits.length}</p>
                    </div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Detalle de Auditoría por Cuenta</h2>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Cuenta</TableHead>
                            <TableHead className="font-semibold">Tipo</TableHead>
                            <TableHead className="text-right font-semibold">Balance Calculado</TableHead>
                            <TableHead className="text-right font-semibold">Balance Reportado</TableHead>
                            <TableHead className="text-right font-semibold">Diferencia</TableHead>
                            <TableHead className="text-center font-semibold">Estado</TableHead>
                            <TableHead className="text-center font-semibold">Movimientos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {audits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No hay cuentas bancarias para auditar
                                </TableCell>
                            </TableRow>
                        ) : (
                            audits.map((audit) => (
                                <TableRow
                                    key={audit.accountId}
                                    className={audit.hasDiscrepancy ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-muted/20'}
                                >
                                    <TableCell className="font-medium">
                                        {audit.accountName}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-700">
                                            {audit.accountType}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatCurrency(audit.calculatedBalance)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatCurrency(audit.reportedBalance)}
                                    </TableCell>
                                    <TableCell className={`text-right font-mono font-semibold text-sm ${audit.hasDiscrepancy ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {audit.hasDiscrepancy ? formatCurrency(audit.difference) : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {audit.hasDiscrepancy ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                                                <AlertTriangle className="h-3 w-3" />
                                                Discrepancia
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                                                <CheckCircle2 className="h-3 w-3" />
                                                OK
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                            {audit.movementCount}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <div className="text-blue-600 mt-0.5">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="text-sm text-blue-700">
                        <p className="font-semibold mb-1">¿Qué significa esta auditoría?</p>
                        <p>
                            El <strong>Balance Calculado</strong> se deriva de la suma de todos los movimientos financieros registrados en el sistema (ledger contable).
                            El <strong>Balance Reportado</strong> es el saldo actual almacenado en cada cuenta bancaria.
                            Si existe una <strong>Discrepancia</strong>, indica que hubo movimientos no sincronizados o errores de registro.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
