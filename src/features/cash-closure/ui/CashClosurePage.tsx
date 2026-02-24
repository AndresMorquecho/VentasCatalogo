import { useState } from 'react';
import { useFinancialRecords } from '@/entities/financial-record/model/queries';
import { useBankAccountList } from '@/features/bank-accounts/api/hooks';
import { createCashClosureSnapshot } from '@/entities/cash-closure/model/model';
import { createDetailedCashClosureReport } from '@/entities/cash-closure/model/detailed-model';
import { useCreateCashClosure, useCashClosures } from '@/features/cash-closure/api/hooks';
import { CashClosureDetailedSummary } from './CashClosureDetailedSummary';
import { CashClosureHistory } from './CashClosureHistory';
import { generateCashClosurePDF } from '../lib/generateCashClosurePDF';
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CalendarIcon, Loader2, FileDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { useToast } from "@/shared/ui/use-toast";

import type { CreateCashClosurePayload } from '@/entities/cash-closure/model/types';
import type { CashClosureDetailedReport } from '@/entities/cash-closure/model/detailed-types';

export function CashClosurePage() {
    // 1. Estados Locales
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [previewPayload, setPreviewPayload] = useState<CreateCashClosurePayload | null>(null);
    const [detailedReport, setDetailedReport] = useState<CashClosureDetailedReport | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // 2. Hooks de Datos UI
    const { data: records = [], isLoading: isLoadingRecords } = useFinancialRecords();
    const { data: bankAccounts = [], isLoading: isLoadingBanks } = useBankAccountList();
    const { data: closures = [], isLoading: isLoadingClosures } = useCashClosures();

    // 3. Mutación
    const createClosure = useCreateCashClosure();
    const { showToast } = useToast();

    // 4. Handlers
    const handleCalculate = () => {
        if (!fromDate || !toDate) return;

        // Generar Snapshot Puro
        const payload = createCashClosureSnapshot(
            fromDate,
            toDate,
            records,
            bankAccounts
        );

        // Generar Reporte Detallado
        const detailed = createDetailedCashClosureReport(
            fromDate,
            toDate,
            records,
            bankAccounts,
            'Usuario Actual' // TODO: Obtener del contexto de autenticación
        );

        setPreviewPayload(payload);
        setDetailedReport(detailed);
    };

    const handleConfirmClosure = async () => {
        if (!previewPayload || !detailedReport) return;

        try {
            // Check if closure already exists for this period
            const existingClosure = closures.find(c =>
                c.fromDate === fromDate && c.toDate === toDate
            );

            if (existingClosure) {
                showToast(
                    `Ya existe un cierre para el período ${fromDate} - ${toDate}. Elimínalo primero si necesitas crear uno nuevo.`,
                    "error"
                );
                return;
            }

            // Add detailed report to payload for storage
            const payloadWithDetails = {
                ...previewPayload,
                detailedReport: detailedReport
            };

            console.log('[DEBUG] Guardando cierre de caja:', {
                fromDate,
                toDate,
                totalIncome: payloadWithDetails.totalIncome,
                totalExpense: payloadWithDetails.totalExpense,
                netTotal: payloadWithDetails.netTotal,
                movementCount: payloadWithDetails.movementCount,
                hasDetailedReport: !!payloadWithDetails.detailedReport
            });

            await createClosure.mutateAsync(payloadWithDetails);
            setPreviewPayload(null); // Reset after success
            setDetailedReport(null);
            setFromDate("");
            setToDate("");
            showToast("Cierre de caja confirmado exitosamente", "success");
        } catch (error) {
            console.error("Error creating closure", error);
            showToast("Error al crear el cierre de caja", "error");
        }
    };

    const handleDownloadPDF = async () => {
        if (!detailedReport) return;

        setIsGeneratingPDF(true);
        try {
            await generateCashClosurePDF(detailedReport);
            showToast("PDF generado exitosamente", "success");
        } catch (error) {
            console.error("Error generating PDF", error);
            showToast("Error al generar el PDF", "error");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const isLoading = isLoadingRecords || isLoadingBanks || isLoadingClosures;

    return (
        <div className="space-y-6 container mx-auto py-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Cierre de Caja</h1>
            </div>

            {/* Panel de Control */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <h2 className="text-lg font-semibold">Nuevo Cierre</h2>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Desde</label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Hasta</label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleCalculate}
                            disabled={!fromDate || !toDate || isLoading}
                            className="w-full"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                            Calcular Totales
                        </Button>
                    </div>
                </div>

                {/* Preview / Resumen */}
                <div className="col-span-2">
                    {previewPayload && detailedReport ? (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertTitle className="text-blue-800">Vista Previa del Cierre</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                    Revisa los totales antes de confirmar. Esta acción guardará una foto inmutable del estado financiero actual.
                                </AlertDescription>
                            </Alert>

                            <CashClosureDetailedSummary report={detailedReport} />

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    size="lg"
                                    onClick={handleDownloadPDF}
                                    variant="outline"
                                    disabled={isGeneratingPDF}
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                >
                                    {isGeneratingPDF ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileDown className="mr-2 h-4 w-4" />
                                    )}
                                    Descargar PDF Detallado
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handleConfirmClosure}
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Confirmar y Cerrar Caja
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-muted-foreground bg-muted/50">
                            Selecciona un rango de fechas para calcular el cierre
                        </div>
                    )}
                </div>
            </div>

            {/* Historial */}
            <CashClosureHistory closures={closures} />
        </div>
    )
}
