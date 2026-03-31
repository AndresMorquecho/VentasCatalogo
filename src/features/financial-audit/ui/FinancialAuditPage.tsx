import { useFinancialAudit } from '../model/useFinancialAudit';
import { AlertTriangle, CheckCircle2, TrendingUp, Calculator, ShieldCheck, Activity } from 'lucide-react';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { KpiCard } from '@/features/dashboard/ui/KpiCard';
import { cn } from '@/shared/lib/utils';

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
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <div className="h-12 w-12 border-4 border-slate-100 border-t-monchito-purple rounded-full animate-spin" />
                <div className="text-slate-400 font-black uppercase tracking-widest text-xs">Ejecutando auditoría financiera...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 flex items-center gap-4 animate-in fade-in zoom-in-95">
                <AlertTriangle className="h-10 w-10 text-rose-500" />
                <div>
                   <h3 className="font-black text-lg">Error de Auditoría</h3>
                   <p className="text-sm opacity-80">{error.message}</p>
                </div>
            </div>
        );
    }

    const hasIssues = totalDiscrepancies > 0;

    return (
        <div className="min-h-screen bg-[#fcfaff]">
            <div className="px-4 lg:px-12 pt-12 space-y-12">
                <PageHeader 
                    title="Auditoría Financiera" 
                    description="Reconciliación de balances calculados vs reportados en tiempo real."
                    icon={Calculator}
                />

                {/* Status KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    <KpiCard
                        title="Estado General"
                        value={hasIssues ? 'Alerta' : 'Saludable'}
                        trend={hasIssues ? 10 : 0}
                        icon={hasIssues ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                        color={hasIssues ? "danger" : "success"}
                        sparklineData={hasIssues ? [10, 20, 30, 25, 40, 50, 60] : [10, 10, 10, 10, 10, 10, 10]}
                        description={hasIssues ? `${totalDiscrepancies} cuentas con diferencias` : "Consistencia del 100%"}
                    />
                    <KpiCard
                        title="Cuentas Auditadas"
                        value={audits.length}
                        trend={0}
                        icon={<Activity className="h-5 w-5" />}
                        color="info"
                        sparklineData={[30, 40, 35, 50, 45, 60, 55]}
                        description="Total de depósitos y cajas"
                    />
                    <div className={cn(
                        "bg-white/80 backdrop-blur-md border px-8 py-6 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.03)] flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300",
                        hasIssues ? "border-rose-100" : "border-emerald-100"
                    )}>
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Último Corte</p>
                                <h3 className="text-2xl font-black text-slate-900 font-display">
                                    {new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </h3>
                            </div>
                            <div className={cn(
                                "p-3 rounded-2xl",
                                hasIssues ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                            )}>
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-4 flex items-center gap-2">
                             Precisión de datos: <span className={hasIssues ? "text-rose-500" : "text-emerald-500"}>{hasIssues ? 'Inconsistente' : 'Alta'}</span>
                        </p>
                    </div>
                </div>

                {/* Audit Table Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-monchito-purple" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Detalle Táctico de Auditoría</h2>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-md border-none shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-b border-slate-100 px-4">
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400/80">Cuenta / Depósito</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400/80">Tipo</TableHead>
                                    <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400/80">Balance Calculado</TableHead>
                                    <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400/80">Balance Reportado</TableHead>
                                    <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400/80">Diferencia</TableHead>
                                    <TableHead className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400/80">Estatus</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {audits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic">
                                            No hay cuentas bancarias activas para el proceso de auditoría.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    audits.map((audit) => (
                                        <TableRow
                                            key={audit.accountId}
                                            className={cn(
                                                "hover:bg-monchito-purple/[0.02] transition-all duration-300 group",
                                                audit.hasDiscrepancy ? 'bg-rose-50/20' : ''
                                            )}
                                        >
                                            <TableCell className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 tracking-tight">{audit.accountName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {audit.accountId.substring(0, 8)}...</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
                                                    {audit.accountType}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-right font-mono text-sm font-bold text-slate-600">
                                                {formatCurrency(audit.calculatedBalance)}
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-right font-mono text-sm font-black text-slate-900">
                                                {formatCurrency(audit.reportedBalance)}
                                            </TableCell>
                                            <TableCell className={cn(
                                                "px-8 py-5 text-right font-mono font-black text-sm",
                                                audit.hasDiscrepancy ? 'text-rose-600' : 'text-emerald-500'
                                            )}>
                                                {audit.hasDiscrepancy ? formatCurrency(audit.difference) : '0.00'}
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                                    audit.hasDiscrepancy 
                                                        ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                )}>
                                                    {audit.hasDiscrepancy ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                                    {audit.hasDiscrepancy ? 'Discrepancia' : 'Consistente'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Technical Insights Section */}
                <div className="bg-slate-900 text-slate-300 p-10 rounded-3xl relative overflow-hidden group mb-12 shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 transform group-hover:scale-110 transition-transform duration-700 opacity-10">
                         <Calculator className="h-64 w-64" />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-[0.1em]">Protocolo de Verificación</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-400 font-medium">
                            El <strong>Balance Calculado</strong> representa la suma histórica de los registros en el ledger. 
                            El <strong>Balance Reportado</strong> es el estado nominal actual. 
                            Cualquier desviación requiere un análisis de logs financieros para identificar movimientos huérfanos o dobles registros.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

