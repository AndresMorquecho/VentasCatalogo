import { useState } from 'react';
import { useCreateCashClosure, useCashClosures, useCashClosurePreview } from '@/features/cash-closure/api/hooks';
import { CashClosureHistory } from './CashClosureHistory';
import { CashClosureConfirmModal } from './CashClosureConfirmModal';
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, HelpCircle, Wallet, CheckCircle2, FileText, AlertCircle, Calendar, Banknote, Calculator, TrendingUp, Users, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { useNotifications } from "@/shared/lib/notifications";
import { logAction } from "@/shared/lib/auditService";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { generateCashClosurePDF } from '../lib/generateCashClosurePDF';
import { useAuth } from '@/shared/auth';
import { usersApi } from '@/shared/auth/authApi';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '@/shared/ui/pagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useScrollIndicator } from '../hooks/useScrollIndicator';
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal";
import { CashClosureDetailedPDF } from './CashClosureDetailedPDF';

const fmt = (n: number) => `$${n.toFixed(2)}`;

function SectionTitle({ icon: Icon, label, color = 'text-slate-700' }: { icon: any; label: string; color?: string }) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className={`text-xs font-black uppercase tracking-widest ${color}`}>{label}</span>
        </div>
    );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' | 'blue' }) {
    const cls = highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-500' : highlight === 'blue' ? 'text-blue-600' : 'text-slate-800';
    return (
        <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
            <span className="text-xs text-slate-500">{label}</span>
            <span className={`text-xs font-bold ${cls}`}>{value}</span>
        </div>
    );
}

export function CashClosurePage() {
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [actualAmount, setActualAmount] = useState<number>(0);
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'closure' | 'history'>('closure');
    
    // PDF Preview States
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewReportData, setPreviewReportData] = useState<any>(null);
    const [previewFileName, setPreviewFileName] = useState("");

    const { data: response, refetch: refetchClosures } = useCashClosures({ page, limit });
    const closures = response?.data || [];
    const pagination = response?.pagination;

    // Fetch users for the filter
    const { data: usersResponse } = useQuery({
        queryKey: ['users-list-closure'],
        queryFn: () => usersApi.getAll(1, 100),
    });
    const systemUsers = usersResponse?.data || [];

    const { scrollRef: saldosScrollRef, showBottomShadow: showSaldosBottomShadow } = useScrollIndicator();
    const { scrollRef: previewScrollRef, showBottomShadow: showPreviewBottomShadow } = useScrollIndicator();

    const createClosure = useCreateCashClosure();
    const { notifySuccess, notifyError } = useNotifications();
    const { hasPermission, user } = useAuth();

    const [year, month, day] = date.split('-').map(Number);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const { data: previewData, isLoading: isCalculating, refetch: refetchPreview } = useCashClosurePreview(
        endOfDay.toISOString(),
        selectedUserId === 'all' ? undefined : selectedUserId
    );

    const handleOpenConfirmModal = () => {
        if (!hasPermission('cash_closure.close')) { notifyError({ message: "No tienes permiso para realizar cierres de caja" }); return; }
        if (!previewData || previewData.isAlreadyClosed) return;
        if (selectedUserId !== 'all') { notifyError({ message: "Para realizar un cierre oficial debe seleccionar 'Todos los Usuarios'" }); return; }
        if (actualAmount === 0) { notifyError({ message: "Debes ingresar el monto de efectivo contado" }); return; }
        setShowConfirmModal(true);
    };

    const handleConfirmClosure = async (notes: string) => {
        if (!previewData) return;
        try {
            const [y, m, d] = date.split('-').map(Number);
            const eod = new Date(y, m - 1, d, 23, 59, 59, 999);
            const result = await createClosure.mutateAsync({ toDate: eod.toISOString(), actualAmount, notes });
            notifySuccess("Cierre de caja confirmado exitosamente");
            if (user) {
                logAction({ userId: user.id, userName: user.username, action: 'UPDATE_ROLE', module: 'cash_closure' as any, detail: `Realizó cierre de caja por ${actualAmount.toFixed(2)}`, severity: 'CRITICAL' });
            }
            if (result.detailedReport) {
                setPreviewReportData({
                    ...result.detailedReport,
                    expectedAmount: result.expectedAmount,
                    actualAmount: result.actualAmount,
                    difference: result.difference,
                    notes: result.notes || notes
                });
                setPreviewFileName(`Cierre_Oficial_${new Date().toISOString().split('T')[0]}.pdf`);
                setPreviewModalOpen(true);
            }
            setActualAmount(0);
            setShowConfirmModal(false);
            refetchClosures();
            await refetchPreview();
        } catch (error: any) {
            notifyError(error, "Error al crear el cierre de caja");
        }
    };

    const handleDownloadPreviewReport = async () => {
        if (!previewData) return;
        const reportUser = selectedUserId === 'all' ? 'GLOBAL' : systemUsers.find(u => u.id === selectedUserId)?.username.toUpperCase();
        
        setPreviewReportData({
            ...previewData,
            closedByName: user?.username || 'Usuario',
            closedAt: new Date().toISOString(),
            actualAmount,
            expectedAmount: expected,
            difference,
            notes: "VISTA PREVIA DE AUDITORÍA (BORRADOR NO OFICIAL)"
        });
        setPreviewFileName(`Vista_Previa_Cierre_${reportUser}_${date}.pdf`);
        setPreviewModalOpen(true);
    };

    const expected = previewData?.expectedAmount || 0;
    const difference = actualAmount - expected;
    const isDifferenceSignificant = Math.abs(difference) > 0.01;

    const formatStartDate = (isoDate: string | null) => {
        if (!isoDate) return "Iniciando...";
        const d = new Date(isoDate);
        if (d.getFullYear() <= 1970) return "Inicio de Registros";
        return d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
    };

    const p = previewData as any;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
            <PageHeader
                className="shrink-0"
                title="Control de Caja"
                description="Gestión de saldos, auditoría y cierres de periodo"
                icon={Calculator}
                actions={
                    <>
                        <div className="flex gap-2">
                            <Button variant={activeTab === 'closure' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('closure')} className="gap-2 font-bold h-8 text-xs">
                                <CheckCircle2 className="h-4 w-4" /> Realizar Cierre
                            </Button>
                            <Button variant={activeTab === 'history' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('history')} className="gap-2 font-bold h-8 text-xs">
                                <FileText className="h-4 w-4" /> Historial
                            </Button>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 font-bold border-2 hover:bg-slate-50 h-8 text-xs">
                                    <HelpCircle className="h-4 w-4 text-blue-500" /> Guía Rápida
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                        <CheckCircle2 className="h-6 w-6 text-green-500" /> ¿Cómo realizar un cierre profesional?
                                    </DialogTitle>
                                    <DialogDescription className="text-base pt-4 space-y-4">
                                        {[
                                            ["Verificación de Documentos", "Asegúrate de que todos los pagos del periodo estén registrados."],
                                            ["Conteo Físico", "Cuenta físicamente todo el efectivo billete por billete."],
                                            ["Ingreso de Monto Real", "Digita el valor exacto contado en el campo Efectivo Contado."],
                                            ["Justificación", "Si existe diferencia, usa el campo de notas para explicar el motivo."],
                                            ["Inmutabilidad", "Una vez confirmado, el cierre no se puede editar."],
                                        ].map(([title, desc], i) => (
                                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 border">
                                                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                                                <div><p className="font-bold text-slate-900">{title}</p><p className="text-sm text-slate-500">{desc}</p></div>
                                            </div>
                                        ))}
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </>
                }
            />

            {activeTab === 'closure' ? (
                <div className="grid gap-2 lg:grid-cols-12 flex-1 min-h-0 mt-2">

                    {/* ── Panel izquierdo: Saldos + Cierre ── */}
                    <div className="lg:col-span-4 flex flex-col min-h-0">
                        <Card className="shadow-lg border-none ring-1 ring-slate-200 overflow-hidden flex flex-col h-full relative">
                            <div className="h-2 bg-primary w-full shrink-0" />
                            <CardHeader className="bg-slate-50/50 pb-2 pt-3 shrink-0">
                                <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-primary" /> Saldos del Sistema
                                </CardTitle>
                            </CardHeader>
                            <CardContent ref={saldosScrollRef} className="space-y-3 pt-3 flex-1 overflow-y-auto pb-4 min-h-0">
                                {/* Periodo */}
                                <div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Inicio</span>
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Fin</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 items-center mt-1">
                                        <div className="p-2 bg-slate-100 rounded-md text-xs font-bold text-slate-600 border border-slate-200 truncate flex items-center h-8">
                                            {formatStartDate(previewData?.fromDate)}
                                        </div>
                                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 border-primary/20 focus:border-primary font-bold text-slate-900 text-xs px-2" />
                                    </div>
                                </div>

                                {/* Filtro de Usuario */}
                                <div className="pt-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                                        Cajero / Usuario
                                    </label>
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="all">TODOS LOS USUARIOS (CIERRE GLOBAL)</option>
                                        {systemUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                {previewData?.isAlreadyClosed && (
                                    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="font-black">Periodo Cerrado</AlertTitle>
                                        <AlertDescription className="text-xs">Ya se realizó un cierre para este periodo.</AlertDescription>
                                    </Alert>
                                )}

                                {/* Cuentas activas */}
                                <div className="pt-1 border-t border-slate-100">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-2">
                                        <Wallet className="w-3 h-3" /> Cuentas Activas
                                    </p>
                                    {previewData?.allAccountsBalances.map((acc: any) => (
                                        <div key={acc.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded-md ${acc.type === 'CASH' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                    <Wallet className="h-3 w-3" />
                                                </div>
                                                <span className="font-semibold text-xs text-slate-700">{acc.name}</span>
                                            </div>
                                            <span className={`font-bold text-xs ${acc.expectedBalance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                                {fmt(acc.expectedBalance)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Efectivo físico */}
                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                                        <Banknote className="h-3 w-3" /> Efectivo Físico Contado
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                                        <Input type="number" step="0.01" value={actualAmount === 0 ? '' : actualAmount} onChange={(e) => setActualAmount(Number(e.target.value))} className="text-lg font-bold h-9 pl-8 border-2 focus-visible:ring-primary border-slate-100 bg-white shadow-inner text-slate-900" placeholder="0.00" />
                                    </div>

                                    {previewData && !previewData.isAlreadyClosed && (
                                        <div className={`p-2 rounded-lg border flex items-center justify-between ${isDifferenceSignificant ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Diferencia</p>
                                                <p className="text-xl font-bold tracking-tighter">{fmt(difference)}</p>
                                            </div>
                                            {isDifferenceSignificant
                                                ? <Badge className="bg-orange-500 text-white font-bold text-[10px] border-none">DESCUADRE</Badge>
                                                : <Badge className="bg-green-500 text-white font-bold text-[10px] border-none">CUADRADO</Badge>}
                                        </div>
                                    )}

                                    <Button 
                                        onClick={handleOpenConfirmModal} 
                                        disabled={!previewData || previewData.isAlreadyClosed || createClosure.isPending || isCalculating || actualAmount === 0 || selectedUserId !== 'all'} 
                                        className="w-full h-11 rounded-xl bg-monchito-purple hover:bg-monchito-purple/90 text-white font-semibold shadow-lg disabled:opacity-50"
                                    >
                                        {createClosure.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                        {selectedUserId !== 'all' ? "Seleccione 'Todos' para Cerrar" : previewData?.isAlreadyClosed ? "Periodo ya Cerrado" : "Realizar Cierre Oficial"}
                                    </Button>
                                </div>
                            </CardContent>
                            {showSaldosBottomShadow && <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none z-20" />}
                        </Card>
                    </div>

                    {/* ── Panel derecho: Vista previa del cierre ── */}
                    <div className="lg:col-span-8 flex flex-col min-h-0">
                        <Card className="shadow-sm border-none ring-1 ring-slate-200 h-full flex flex-col overflow-hidden relative">
                            <CardHeader className="bg-white border-b p-3 shrink-0">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" /> 
                                        {selectedUserId === 'all' ? 'Vista Previa del Cierre Global' : `Reporte de Usuario: ${systemUsers.find(u => u.id === selectedUserId)?.username.toUpperCase()}`}
                                    </CardTitle>
                                    <div className="flex gap-2 items-center">
                                        <Button variant="outline" size="sm" onClick={handleDownloadPreviewReport} disabled={!previewData || isCalculating} className="h-7 text-[10px] font-bold gap-1.5 border-blue-200 hover:bg-blue-50 text-blue-600">
                                            <FileText className="h-3.5 w-3.5" /> Descargar Reporte
                                        </Button>
                                        <Badge variant="outline" className="font-bold text-[10px] bg-slate-50">{previewData?.movementCount || 0} Registros</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent ref={previewScrollRef} className="p-3 overflow-y-auto flex-1 bg-slate-50/50 min-h-0 space-y-4">
                                {isCalculating ? (
                                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                        <p className="font-bold text-slate-400">Analizando base de datos...</p>
                                    </div>
                                ) : !previewData ? (
                                    <div className="flex flex-col items-center justify-center p-20 text-center space-y-3">
                                        <Info className="h-8 w-8 text-slate-300" />
                                        <p className="font-black text-slate-400">Sin datos para el periodo seleccionado</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* BLOQUE 1: RESUMEN DE FLUJO */}
                                        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                                            <SectionTitle icon={Calculator} label="1. Resumen de Flujo Físico" color="text-slate-700" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                                    <p className="text-[10px] font-bold uppercase text-green-600 mb-1">Total Ingresos (Sistema)</p>
                                                    <p className="text-xl font-black text-green-700">{fmt(previewData.totalIncome)}</p>
                                                </div>
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                                    <p className="text-[10px] font-bold uppercase text-red-600 mb-1">Egresos Reales</p>
                                                    <p className="text-xl font-black text-red-600">{fmt(previewData.totalExpense)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BLOQUE 2: DESGLOSE SEGMENTADO (Las 5 Secciones) */}
                                        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                                            <SectionTitle icon={TrendingUp} label="2. Desglose de Operaciones" color="text-slate-700" />
                                            <div className="space-y-2 mt-3">
                                                {/* Sección 1: Abonos Iniciales */}
                                                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-blue-500 text-[9px] h-4">INICIAL</Badge>
                                                        <span className="text-xs font-bold text-slate-700 uppercase">Abonos Iniciales de Órdenes</span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900">{fmt(previewData.incomeBySource?.orderPayments || 0)}</span>
                                                </div>

                                                {/* Sección 2: Cobros en Entrega */}
                                                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-emerald-500 text-[9px] h-4">ENTREGA</Badge>
                                                        <span className="text-xs font-bold text-slate-700 uppercase">Cobros al Entregar Producto</span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900">{fmt(previewData.incomeBySource?.deliveryPayments || 0)}</span>
                                                </div>

                                                {/* Sección 3: Abonos Normales */}
                                                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-primary text-[9px] h-4">ABONOS</Badge>
                                                        <span className="text-xs font-bold text-slate-700 uppercase">Abonos Posteriores (Mód. Abonos)</span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900">{fmt(previewData.incomeBySource?.additionalPayments || 0)}</span>
                                                </div>

                                                {/* Sección 4: Ventas Catálogo */}
                                                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-orange-500 text-[9px] h-4">VENTAS</Badge>
                                                        <span className="text-xs font-bold text-slate-700 uppercase">Ventas Directas de Catálogo</span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900">{fmt(previewData.incomeBySource?.catalogSales || 0)}</span>
                                                </div>
                                                
                                                {/* Otros: Recargas y Ajustes */}
                                                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100 opacity-60 italic">
                                                    <span className="text-xs font-medium text-slate-500 uppercase">Resguardo (Recargas/Ajustes)</span>
                                                    <span className="text-sm font-medium text-slate-500">{fmt((previewData.incomeBySource?.walletRecharges || 0) + (previewData.incomeBySource?.adjustments || 0))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BLOQUE 3: BILLETERA VIRTUAL (Informativo) */}
                                        <div className="bg-violet-50 rounded-xl border border-violet-100 p-3 shadow-sm">
                                            <SectionTitle icon={Users} label="3. Uso de Billetera Virtual" color="text-violet-600" />
                                            <div className="p-3 bg-white rounded-lg border border-violet-100 mt-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-violet-700 uppercase leading-none">Saldo a Favor Aplicado</span>
                                                    <span className="text-lg font-black text-violet-700">{fmt(previewData.movements?.filter((m: any) => m.isCreditApplication).reduce((s: number, m: any) => s + m.amount, 0) || 0)}</span>
                                                </div>
                                                <p className="text-[9px] text-violet-400 font-medium italic">Nota: Este valor liquida deudas pero no entra como dinero físico a caja.</p>
                                            </div>
                                        </div>

                                        {/* BLOQUE 4: POR MÉTODO DE PAGO */}
                                        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                                            <SectionTitle icon={Banknote} label="4. Resumen por Método" color="text-slate-600" />
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {Object.entries(previewData.incomeByMethod || {}).map(([method, val]: any) => val > 0 && (
                                                    <div key={method} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{method}</span>
                                                        <span className="text-xs font-black text-slate-800">{fmt(val)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* BLOQUE 5: HISTORIAL DETALLADO */}
                                        {previewData.movements?.length > 0 && (
                                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                                                <SectionTitle icon={FileText} label="5. Historial Detallado" color="text-slate-600" />
                                                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {previewData.movements.map((move: any) => (
                                                        <div key={move.id} className={`py-2 flex justify-between items-start gap-2 ${move.isInternal ? 'opacity-50' : ''}`}>
                                                            <div className="flex gap-2 min-w-0">
                                                                <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${move.isInternal ? 'bg-violet-400' : move.movementType === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-bold text-slate-800 truncate leading-tight uppercase tracking-tight">{move.description || move.moduleLabel}</p>
                                                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5">
                                                                        <span className="font-medium">{new Date(move.date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        <span>•</span>
                                                                        <span className="text-primary/70 font-black uppercase text-[8px]">{move.accountName}</span>
                                                                        {move.paymentMethod && <span>• {move.paymentMethod}</span>}
                                                                        {move.isCreditApplication && <span className="bg-blue-50 text-blue-500 px-1 rounded uppercase font-bold">Billetera</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className={`text-[11px] font-black leading-none ${move.isInternal ? 'text-violet-500' : move.movementType === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                                                                    {move.movementType === 'INCOME' ? '+' : '-'}{fmt(move.amount)}
                                                                </p>
                                                                <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">{move.user}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* BLOQUE 6: DESGLOSE POR USUARIO (Solo en vista global) */}
                                        {selectedUserId === 'all' && p?.movementsByUser && p.movementsByUser.length > 0 && (
                                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                                                <SectionTitle icon={Users} label="6. Desglose por Usuario" color="text-slate-600" />
                                                <div className="space-y-2">
                                                    {p.movementsByUser.map((u: any) => (
                                                        <div key={u.userId} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-slate-700">{u.userName}</span>
                                                                <Badge variant="outline" className="text-[10px]">{u.movementCount} mov.</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <StatRow label="Ingresos" value={fmt(u.totalIncome)} highlight="green" />
                                                                <StatRow label="Egresos" value={fmt(u.totalExpense)} highlight="red" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                            <div className="p-2 bg-slate-50 border-t shrink-0 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="flex gap-4">
                                    <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-green-500" /> Ingresos: <span className="text-green-600">{fmt(previewData?.totalIncome || 0)}</span></span>
                                    <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /> Egresos: <span className="text-red-500">{fmt(previewData?.totalExpense || 0)}</span></span>
                                </div>
                                <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                    Neto: <span className="font-black">{fmt((previewData?.totalIncome || 0) - (previewData?.totalExpense || 0))}</span>
                                </div>
                            </div>
                            {showPreviewBottomShadow && <div className="absolute bottom-10 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 via-slate-50/50 to-transparent pointer-events-none z-20" />}
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="h-full bg-white rounded-lg shadow-sm border border-slate-200 p-2 overflow-y-auto flex flex-col mt-2">
                    <CashClosureHistory closures={closures} onDeleteSuccess={() => { refetchClosures(); refetchPreview(); }} />
                    {pagination && (
                        <div className="mt-4 pb-4">
                            <Pagination currentPage={page} totalPages={pagination.pages} onPageChange={setPage} totalItems={pagination.total} itemsPerPage={limit} />
                        </div>
                    )}
                </div>
            )}

            <CashClosureConfirmModal 
                open={showConfirmModal}
                onOpenChange={setShowConfirmModal}
                previewData={previewData}
                actualAmount={actualAmount}
                expectedAmount={expected}
                difference={difference}
                onConfirm={handleConfirmClosure}
                isLoading={createClosure.isPending}
            />

            {previewReportData && (
                <PDFPreviewModal
                    open={previewModalOpen}
                    onOpenChange={setPreviewModalOpen}
                    title="Reporte de Cierre de Caja"
                    fileName={previewFileName}
                    pdfDocument={<CashClosureDetailedPDF report={previewReportData} />}
                    onDownload={() => {
                        generateCashClosurePDF(previewReportData, previewFileName);
                    }}
                />
            )}
        </div>
    );
};
