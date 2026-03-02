import { useState, useEffect } from 'react';
import { cashClosureApi } from '@/shared/api/cashClosureApi';
import { useCreateCashClosure, useCashClosures } from '@/features/cash-closure/api/hooks';
import { CashClosureHistory } from './CashClosureHistory';
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, Info, HelpCircle, Wallet, CheckCircle2, FileText, Calendar, Banknote, Calculator } from "lucide-react";
import { useToast } from "@/shared/ui/use-toast";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { generateCashClosurePDF } from '../lib/generateCashClosurePDF';
import { useAuth } from '@/shared/auth';
import { PageHeader } from "@/shared/ui/PageHeader";
import { MonchitoTabs } from "@/shared/ui/MonchitoTabs";
import type { MonchitoTabConfig } from "@/shared/ui/MonchitoTabs";

export function CashClosurePage() {
    // 1. Estados Locales
    const [activeTab, setActiveTab] = useState<'closure' | 'history'>('closure');
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
            const [year, month, day] = date.split('-').map(Number);
            const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

            const result = await cashClosureApi.getPreview(endOfDay.toISOString());
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
            await fetchPreview();
        } catch (error: any) {
            console.error("Error creating closure", error);
            showToast(error.response?.data?.error?.message || "Error al crear el cierre de caja", "error");
        }
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
    const TABS: MonchitoTabConfig[] = [
        { id: 'closure', label: 'Realizar Cierre', icon: Banknote },
        { id: 'history', label: 'Historial', icon: FileText },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Control de Caja"
                description="Gestión de saldos, auditoría y cierres de periodo financiero."
                icon={Calculator}
                actions={
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 font-bold border-2 hover:bg-slate-50 h-9 transition-all active:scale-95">
                                <HelpCircle className="h-4 w-4 text-monchito-teal" />
                                Guía Rápida
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                    <CheckCircle2 className="h-6 w-6 text-monchito-teal" />
                                    ¿Cómo realizar un cierre profesional?
                                </DialogTitle>
                                <DialogDescription className="text-base pt-4 space-y-4">
                                    <div className="space-y-4 text-slate-600">
                                        {[
                                            { step: 1, title: 'Verificación de Documentos', desc: 'Asegúrate de que todos los pagos en efectivo del periodo estén registrados.' },
                                            { step: 2, title: 'Conteo Físico', desc: 'Cuenta físicamente todo el efectivo billete por billete y moneda por moneda.' },
                                            { step: 3, title: 'Ingreso de Monto Real', desc: 'Digita el valor exacto contado en el campo "Efectivo Contado".' },
                                            { step: 4, title: 'Justificación', desc: 'Si existe una diferencia, utiliza el campo de notas para explicar el motivo.' }
                                        ].map((item) => (
                                            <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="h-8 w-8 rounded-full bg-monchito-purple text-white flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight">{item.title}</p>
                                                    <p className="text-sm opacity-80 mt-1">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                }
            />

            <MonchitoTabs
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as 'closure' | 'history')}
            />

            {/* Content Section */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'closure' ? (
                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* Audit Panel */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <Card className="shadow-lg border-none ring-1 ring-slate-200 overflow-hidden">
                                <div className="h-2 bg-[#570d64] w-full" />
                                <div className="p-4 pt-6 pb-2 flex items-center gap-3">
                                    <div className="h-6 w-1.5 rounded-full bg-monchito-purple" />
                                    <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase text-[13px] tracking-widest font-monchito flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-monchito-purple" />
                                        Saldos del Sistema
                                    </h2>
                                </div>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Inicio</span>
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Fin</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 items-center">
                                        <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 truncate flex items-center h-10">
                                            {formatStartDate(previewData?.fromDate)}
                                        </div>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-10 border-slate-200 focus:border-[#570d64] font-bold text-slate-900 text-xs px-3"
                                        />
                                    </div>

                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        {previewData?.allAccountsBalances.map((acc: any) => (
                                            <div key={acc.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${acc.type === 'CASH' ? 'bg-[#570d64] text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                        <Wallet className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-bold text-sm text-slate-700">{acc.name}</span>
                                                </div>
                                                <span className={`font-black text-sm tracking-tight ${acc.expectedBalance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                                    ${acc.expectedBalance.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                <Banknote className="h-3 w-3" /> Efectivo Físico
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-300">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={actualAmount === 0 ? '' : actualAmount}
                                                    onChange={(e) => setActualAmount(Number(e.target.value))}
                                                    className="text-2xl font-black h-14 pl-10 border-2 focus-visible:ring-[#20a29a] border-slate-100 bg-slate-50/50 shadow-inner text-slate-900 rounded-xl"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {previewData && !previewData.isAlreadyClosed && (
                                            <div className={`p-4 rounded-xl border flex items-center justify-between transition-all shadow-sm ${isDifferenceSignificant ? 'bg-[#f0cd23]/10 border-[#f0cd23]/30 text-[#570d64]' : 'bg-[#20a29a]/10 border-[#20a29a]/30 text-[#20a29a]'}`}>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Diferencia</p>
                                                    <p className="text-2xl font-black tracking-tighter">
                                                        ${difference.toFixed(2)}
                                                    </p>
                                                </div>
                                                {isDifferenceSignificant ? (
                                                    <Badge className="bg-[#f0cd23] text-[#570d64] font-black text-[10px] border-none px-2 py-0.5">DESCUADRE</Badge>
                                                ) : (
                                                    <Badge className="bg-[#20a29a] text-white font-black text-[10px] border-none px-2 py-0.5">CUADRADO</Badge>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                                <FileText className="h-3 w-3" /> Notas de Auditoría
                                            </label>
                                            <Input
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Justifica cualquier diferencia aquí..."
                                                className="bg-slate-50 border-slate-200 h-10 text-sm px-3 rounded-lg"
                                            />
                                        </div>

                                        <Button
                                            onClick={handleConfirmClosure}
                                            disabled={!previewData || previewData.isAlreadyClosed || createClosure.isPending || isCalculating}
                                            className={`w-full h-12 text-base font-bold shadow-lg rounded-xl transition-all active:scale-95 ${isDifferenceSignificant ? 'bg-[#f0cd23] hover:bg-[#e0bc10] text-[#570d64]' : 'bg-[#20a29a] hover:bg-[#1b8c85] text-white'}`}
                                        >
                                            {createClosure.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                            {previewData?.isAlreadyClosed ? "Periodo ya Cerrado" : "Finalizar y Cerrar Caja"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Movements Details Section */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <Card className="shadow-sm border-none ring-1 ring-slate-200 h-full flex flex-col overflow-hidden">
                                <div className="bg-white border-b sticky top-0 z-10 p-4 shrink-0">
                                    <div className="flex justify-between items-center py-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1.5 rounded-full bg-monchito-purple" />
                                            <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase text-[13px] tracking-widest font-monchito flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-monchito-teal" />
                                                Detalle de Movimientos
                                            </h2>
                                        </div>
                                        <Badge variant="outline" className="font-bold text-xs px-2 py-0.5 rounded-full bg-slate-50 border-slate-200">{previewData?.movementCount || 0} Registros</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 ml-4.5">Movimientos de la cuenta de EFECTIVO desde el último cierre.</p>
                                </div>
                                <CardContent className="p-0 overflow-y-auto flex-grow bg-slate-50/30">
                                    {isCalculating ? (
                                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                            <Loader2 className="h-12 w-12 text-[#20a29a] animate-spin" />
                                            <p className="font-bold text-slate-400">Analizando base de datos...</p>
                                        </div>
                                    ) : previewData?.detailedMovements.length > 0 ? (
                                        <div className="divide-y divide-slate-100 px-2">
                                            {previewData.detailedMovements.map((move: any) => (
                                                <div key={move.id} className={`p-4 rounded-xl my-1 hover:bg-white transition-all group ${move.isCreditApplication ? 'bg-slate-50/50 opacity-80' : ''}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-4">
                                                            <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-offset-0 ${move.isCreditApplication ? 'bg-slate-300 ring-slate-100' : (move.isCashAccount ? (move.movementType === 'INCOME' ? 'bg-emerald-500 ring-emerald-50' : 'bg-rose-500 ring-rose-50') : 'bg-[#570d64] ring-[#570d64]/5')}`} />
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-slate-900 leading-none">{move.description}</p>
                                                                    {move.isCreditApplication && (
                                                                        <Badge variant="outline" className="text-[9px] h-4 bg-blue-50 text-blue-600 border-blue-200 font-black px-1.5">SALDO A FAVOR</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    <span>{new Date(move.date).toLocaleString()}</span>
                                                                    <span>•</span>
                                                                    <span className="text-[#570d64] font-black">{move.accountName}</span>
                                                                    <span>•</span>
                                                                    <span>{move.type}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-base font-black tracking-tight ${move.isCreditApplication ? 'text-slate-400' : (move.movementType === 'INCOME' ? 'text-emerald-600' : 'text-rose-500')}`}>
                                                                {move.movementType === 'INCOME' ? '+' : '-'}${move.amount.toFixed(2)}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase italic">Por: {move.user}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                                            <div className="p-6 bg-white rounded-full shadow-sm border border-slate-100">
                                                <Info className="h-10 w-10 text-slate-200" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-400 text-lg uppercase tracking-widest">Sin movimientos</h3>
                                                <p className="text-sm text-slate-400 max-w-[250px] mx-auto">Selecciona una fecha de corte que incluya transacciones nuevas.</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="p-4 bg-white border-t shrink-0 flex flex-col gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <div className="flex gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                Ingresos: <span className="text-emerald-600 text-sm font-black">${previewData?.totalIncome.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-rose-500" />
                                                Egresos: <span className="text-rose-500 text-sm font-black">${previewData?.totalExpense.toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                        <div className="bg-[#570d64]/10 text-[#570d64] px-4 py-2 rounded-xl border border-[#570d64]/5">
                                            NETO EFECTIVO: <span className="font-black text-base ml-1">${((previewData?.totalIncome || 0) - (previewData?.totalExpense || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 justify-center">
                                        <p className="text-[9px] text-slate-400 text-center font-bold uppercase">
                                            * Los valores reflejados corresponden únicamente a movimientos de la cuenta de efectivo.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        <Card className="shadow-lg border-none ring-1 ring-slate-200 rounded-xl overflow-hidden p-4">
                            <CashClosureHistory closures={closures} />
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
