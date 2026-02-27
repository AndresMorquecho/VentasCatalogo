import { useState, useEffect } from 'react';
import { cashClosureApi } from '@/shared/api/cashClosureApi';
import { useCreateCashClosure, useCashClosures } from '@/features/cash-closure/api/hooks';
import { CashClosureHistory } from './CashClosureHistory';
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, Info, HelpCircle, Wallet, CheckCircle2, FileText, AlertCircle, Calendar, Banknote } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { useToast } from "@/shared/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { generateCashClosurePDF } from '../lib/generateCashClosurePDF';
import { useAuth } from '@/shared/auth';

export function CashClosurePage() {
    // 1. Estados Locales
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [actualAmount, setActualAmount] = useState<number>(0);
    const [notes, setNotes] = useState<string>("");
    const [previewData, setPreviewData] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // 2. Hooks de Datos UI
    const { data: closures = [], refetch: refetchClosures } = useCashClosures();

    // 3. Mutación
    const createClosure = useCreateCashClosure();
    const { showToast } = useToast();
    const { hasPermission } = useAuth();

    // 4. Cargar Vista Previa Inicial
    const fetchPreview = async () => {
        setIsCalculating(true);
        try {
            // Correct way to get LOCAL end of day 23:59:59
            const [year, month, day] = date.split('-').map(Number);
            const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

            const result = await cashClosureApi.getPreview(endOfDay.toISOString());
            // result is the data from the API already unwrapped by httpClient
            setPreviewData(result);
        } catch (error: any) {
            console.error("Error fetching preview", error);
            const msg = error.response?.data?.error?.message || error.message || "Error al conectar con el servidor";
            showToast(msg, "error");
            setPreviewData(null);
        } finally {
            setIsCalculating(false);
        }
    };

    useEffect(() => {
        if (date) fetchPreview();
    }, [date]);

    // 5. Handlers
    const handleConfirmClosure = async () => {
        if (!hasPermission('cash_closure.close')) {
            showToast("No tienes permiso para realizar cierres de caja", "error");
            return;
        }
        if (!previewData) return;

        try {
            const [year, month, day] = date.split('-').map(Number);
            const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

            const result = await createClosure.mutateAsync({
                toDate: endOfDay.toISOString(),
                actualAmount,
                notes
            });

            showToast("Cierre de caja confirmado exitosamente", "success");

            // Generate PDF immediately after success
            if (result.detailedReport) {
                try {
                    await generateCashClosurePDF(result.detailedReport);
                } catch (pdfError) {
                    console.error("Error generating PDF after closure:", pdfError);
                    showToast("Cierre creado, pero hubo un error generando el PDF", "warning");
                }
            }

            setActualAmount(0);
            setNotes("");
            refetchClosures();
            await fetchPreview(); // Force refresh the preview so it resets to 0
        } catch (error: any) {
            console.error("Error creating closure", error);
            showToast(error.response?.data?.error?.message || "Error al crear el cierre de caja", "error");
        }
    };

    const expected = previewData?.expectedAmount || 0;
    const difference = actualAmount - expected;
    const isDifferenceSignificant = Math.abs(difference) > 0.01;

    // Helper for Start Date
    const formatStartDate = (isoDate: string | null) => {
        if (!isoDate) return "Iniciando...";
        const d = new Date(isoDate);
        if (d.getFullYear() <= 1970) return "Inicio de Registros";
        return d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <div className="h-[calc(100vh-70px)] w-full bg-slate-50 p-2 flex flex-col gap-2 overflow-hidden mx-auto">
            <div className="flex justify-between items-center mb-1 shrink-0 px-1">
                <div className="space-y-1 sm:space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Control de Caja</h1>
                    <h2 className="text-base font-medium text-muted-foreground tracking-tight">Gestión de saldos, auditoría y cierres de periodo.</h2>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 font-bold border-2 hover:bg-slate-50 h-8 text-xs">
                            <HelpCircle className="h-4 w-4 text-blue-500" />
                            Guía Rápida
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ¿Cómo realizar un cierre profesional?
                            </DialogTitle>
                            <DialogDescription className="text-base pt-4 space-y-4">
                                <div className="space-y-4">
                                    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border">
                                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                                        <div>
                                            <p className="font-bold text-slate-900">Verificación de Documentos</p>
                                            <p className="text-sm text-slate-500 text-balance">Asegúrate de que todos los pagos en efectivo del periodo estén registrados en el sistema.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border">
                                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                                        <div>
                                            <p className="font-bold text-slate-900">Conteo Físico</p>
                                            <p className="text-sm text-slate-500 text-balance">Cuenta físicamente todo el efectivo billete por billete y moneda por moneda.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border">
                                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                                        <div>
                                            <p className="font-bold text-slate-900">Ingreso de Monto Real</p>
                                            <p className="text-sm text-slate-500 text-balance">Digita el valor exacto contado en el campo "Efectivo Contado".</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border">
                                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                                        <div>
                                            <p className="font-bold text-slate-900">Justificación</p>
                                            <p className="text-sm text-slate-500 text-balance">Si existe una diferencia significativa, utiliza el campo de notas para explicar el motivo.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border">
                                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">5</div>
                                        <div>
                                            <p className="font-bold text-slate-900">Inmutabilidad</p>
                                            <p className="text-sm text-slate-500 text-balance">Una vez confirmado, el cierre no se puede editar. Solo un Administrador puede eliminarlo si se cometió un error grave.</p>
                                        </div>
                                    </div>
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="closure" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-[400px] grid-cols-2 h-9 p-1 bg-slate-100 mb-2 shrink-0">
                    <TabsTrigger value="closure" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Realizar Cierre</TabsTrigger>
                    <TabsTrigger value="history" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="closure" className="flex-1 min-h-0 outline-none">
                    <div className="grid gap-2 lg:grid-cols-12 h-full">
                        {/* Panel de Auditoría (Izquierda) */}
                        <div className="lg:col-span-4 flex flex-col min-h-0">
                            <Card className="shadow-lg border-none ring-1 ring-slate-200 overflow-hidden flex flex-col h-full">
                                <div className="h-2 bg-primary w-full shrink-0" />
                                <CardHeader className="bg-slate-50/50 pb-2 pt-3 shrink-0">
                                    <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-primary" />
                                        Saldos del Sistema
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-3 flex-1 overflow-y-auto pb-4">
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Inicio</span>
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Fin</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 items-center">
                                        <div className="p-2 bg-slate-100 rounded-md text-xs font-bold text-slate-600 border border-slate-200 truncate flex items-center h-8">
                                            {formatStartDate(previewData?.fromDate)}
                                        </div>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-8 border-primary/20 focus:border-primary font-bold text-slate-900 text-xs px-2"
                                        />
                                    </div>

                                    {previewData?.isAlreadyClosed && (
                                        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle className="font-black">Periodo Cerrado</AlertTitle>
                                            <AlertDescription className="text-xs">
                                                Ya se realizó un cierre para este periodo. No se pueden duplicar los cierres.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100">
                                        <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                            <Wallet className="w-3 h-3" /> Cuentas Activas
                                        </p>
                                        {previewData?.allAccountsBalances.map((acc: any) => (
                                            <div key={acc.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1 rounded-md ${acc.type === 'CASH' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                        <Wallet className="h-3 w-3" />
                                                    </div>
                                                    <span className="font-semibold text-xs text-slate-700">{acc.name}</span>
                                                </div>
                                                <span className={`font-bold text-xs tracking-tight ${acc.expectedBalance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                                    ${acc.expectedBalance.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                                                <Banknote className="h-3 w-3" /> Efectivo Físico
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 px-1">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={actualAmount === 0 ? '' : actualAmount}
                                                    onChange={(e) => setActualAmount(Number(e.target.value))}
                                                    className="text-lg font-bold h-9 pl-8 border-2 focus-visible:ring-primary border-slate-100 bg-white shadow-inner text-slate-900"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {previewData && !previewData.isAlreadyClosed && (
                                            <div className={`p-2 rounded-lg border flex items-center justify-between transition-colors shadow-sm ${isDifferenceSignificant ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Diferencia</p>
                                                    <p className="text-xl font-bold tracking-tighter">
                                                        ${difference.toFixed(2)}
                                                    </p>
                                                </div>
                                                {isDifferenceSignificant ? (
                                                    <Badge className="bg-orange-500 text-white font-bold text-[10px] border-none px-1.5 py-0">DESCUADRE</Badge>
                                                ) : (
                                                    <Badge className="bg-green-500 text-white font-bold text-[10px] border-none px-1.5 py-0">CUADRADO</Badge>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                                <FileText className="h-3 w-3" /> Notas
                                            </label>
                                            <Input
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Auditoría/Justificación..."
                                                className="bg-slate-50 border-slate-200 h-8 text-xs px-2"
                                            />
                                        </div>

                                        <Button
                                            onClick={handleConfirmClosure}
                                            disabled={!previewData || previewData.isAlreadyClosed || createClosure.isPending || isCalculating}
                                            className="w-full h-10 text-sm font-bold shadow-md rounded-lg transition-all active:scale-95"
                                            variant={isDifferenceSignificant ? "secondary" : "default"}
                                        >
                                            {createClosure.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                            {previewData?.isAlreadyClosed ? "Periodo ya Cerrado" : "Generar Cierre"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detalle de Movimientos (Derecha) */}
                        <div className="lg:col-span-8 flex flex-col min-h-0">
                            <Card className="shadow-sm border-none ring-1 ring-slate-200 h-full flex flex-col overflow-hidden">
                                <CardHeader className="bg-white border-b sticky top-0 z-10 p-2 shrink-0">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            Detalle de Movimientos
                                        </CardTitle>
                                        <Badge variant="outline" className="font-bold text-[10px]">{previewData?.movementCount || 0} Registros</Badge>
                                    </div>
                                    <CardDescription className="text-[10px]">Movimientos de la cuenta de EFECTIVO desde el último cierre.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 overflow-y-auto flex-grow bg-slate-50/50 min-h-0">
                                    {isCalculating ? (
                                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                            <p className="font-bold text-slate-400">Analizando base de datos...</p>
                                        </div>
                                    ) : previewData?.detailedMovements.length > 0 ? (
                                        <div className="divide-y divide-slate-200">
                                            {previewData.detailedMovements.map((move: any) => (
                                                <div key={move.id} className={`p-4 hover:bg-white transition-colors group ${move.isCreditApplication ? 'bg-slate-50/50 opacity-80' : ''}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1 h-2 w-2 rounded-full ${move.isCreditApplication ? 'bg-slate-300' : (move.isCashAccount ? (move.movementType === 'INCOME' ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500')}`} />
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-black text-slate-900 leading-none">{move.description}</p>
                                                                    {move.isCreditApplication && (
                                                                        <Badge variant="outline" className="text-[9px] h-4 bg-blue-50 text-blue-600 border-blue-200 font-black">SALDO A FAVOR</Badge>
                                                                    )}
                                                                    {!move.isCashAccount && !move.isCreditApplication && (
                                                                        <Badge variant="outline" className="text-[9px] h-4 bg-slate-100 text-slate-600 border-slate-200 font-black">BANCO/TRANSF.</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    <span>{new Date(move.date).toLocaleString()}</span>
                                                                    <span>•</span>
                                                                    <span className="text-primary font-black uppercase">{move.accountName}</span>
                                                                    <span>•</span>
                                                                    <span>{move.type}</span>
                                                                    {move.isCreditApplication && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span className="text-blue-500">NO AFECTA EFECTIVO</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-base font-black tracking-tight ${move.isCreditApplication ? 'text-slate-400' : (move.movementType === 'INCOME' ? 'text-green-600' : 'text-red-500')}`}>
                                                                {move.movementType === 'INCOME' ? '+' : '-'}${move.amount.toFixed(2)}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase italic">Por: {move.user}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-20 text-center space-y-3">
                                            <div className="p-4 bg-slate-100 rounded-full">
                                                <Info className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-400">Sin movimientos en el periodo</h3>
                                                <p className="text-xs text-slate-400">Pruebe seleccionando una fecha de corte que incluya las transacciones de hoy.</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="p-2 bg-slate-50 border-t shrink-0 flex flex-col gap-1">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                Ingresos: <span className="text-green-600">${previewData?.totalIncome.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                                Egresos: <span className="text-red-500">${previewData?.totalExpense.toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                            Neto Efectivo: <span className="font-black">${((previewData?.totalIncome || 0) - (previewData?.totalExpense || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground text-center">
                                        * El Neto solo incluye movimientos de "Efectivo" que afectan el conteo físico.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 min-h-0 outline-none">
                    <div className="h-full bg-white rounded-lg shadow-sm border border-slate-200 p-2 overflow-hidden flex flex-col">
                        <CashClosureHistory closures={closures} />
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    )
}
