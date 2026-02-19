import { useState } from 'react';
import { useFinancialMovements } from '@/features/financial-movement/api/hooks';
import { useBankAccountList } from '@/features/bank-accounts/api/hooks';
import { createCashClosureSnapshot } from '@/entities/cash-closure/model/model';
import { useCreateCashClosure, useCashClosures } from '@/features/cash-closure/api/hooks';
import { CashClosureSummary } from './CashClosureSummary';
import { CashClosureHistory } from './CashClosureHistory';
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
// import { format } from "date-fns"; // Removed unused import

import type { CreateCashClosurePayload } from '@/entities/cash-closure/model/types';

export function CashClosurePage() {
    // 1. Estados Locales
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [previewPayload, setPreviewPayload] = useState<CreateCashClosurePayload | null>(null);

    // 2. Hooks de Datos UI
    const { data: movements = [], isLoading: isLoadingMovements } = useFinancialMovements();
    const { data: bankAccounts = [], isLoading: isLoadingBanks } = useBankAccountList();
    const { data: closures = [], isLoading: isLoadingClosures } = useCashClosures();

    // 3. Mutación
    const createClosure = useCreateCashClosure();

    // 4. Handlers
    const handleCalculate = () => {
        if (!fromDate || !toDate) return;

        // Generar Snapshot Puro
        const payload = createCashClosureSnapshot(
            fromDate,
            toDate,
            movements,
            bankAccounts
        );

        setPreviewPayload(payload);
    };

    const handleConfirmClosure = async () => {
        if (!previewPayload) return;

        try {
            await createClosure.mutateAsync(previewPayload);
            setPreviewPayload(null); // Reset after success
            setFromDate("");
            setToDate("");
        } catch (error) {
            console.error("Error creating closure", error);
        }
    };

    const isLoading = isLoadingMovements || isLoadingBanks || isLoadingClosures;

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
                    {previewPayload ? (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertTitle className="text-blue-800">Vista Previa del Cierre</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                    Revisa los totales antes de confirmar. Esta acción guardará una foto inmutable del estado financiero actual.
                                </AlertDescription>
                            </Alert>

                            <CashClosureSummary data={previewPayload} />

                            <div className="flex justify-end pt-4">
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
