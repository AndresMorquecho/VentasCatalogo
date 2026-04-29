import { ClientList } from "@/features/clients";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Users, Download, Loader2, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { clientApi } from "@/shared/api/clientApi";
import { exportClientsToExcel } from "@/features/clients/lib/exportUtils";
import { useNotifications } from "@/shared/lib/notifications";
import { useAuth } from "@/shared/auth";

export default function ClientsPage() {
    const [isExporting, setIsExporting] = useState(false);
    const [triggerCreate, setTriggerCreate] = useState(false);
    const [activeFilters, setActiveFilters] = useState<any>({});
    const { notifySuccess, notifyError } = useNotifications();
    const { hasPermission } = useAuth();

    const DATA_UPDATE_THRESHOLD_DAYS = 90;

    const handleExportAll = async () => {
        if (!hasPermission('clients.export_excel')) {
            notifyError({ message: 'No tienes permiso para exportar datos a Excel' });
            return;
        }
        try {
            setIsExporting(true);
            
            // Extract filters but use a large limit for export
            const { showOnlyOutdated, ...apiFilters } = activeFilters;
            
            const response = await clientApi.getAll({ 
                ...apiFilters,
                limit: 5000 // Large limit for export
            });

            let dataToExport = response.data || [];

            // Apply client-side "outdated" filter if active
            if (showOnlyOutdated) {
                const { differenceInDays } = await import("date-fns");
                const now = new Date();
                dataToExport = dataToExport.filter((c: any) => {
                    const lastUpdate = c.lastDataUpdate ? new Date(c.lastDataUpdate) : null;
                    const days = lastUpdate ? differenceInDays(now, lastUpdate) : DATA_UPDATE_THRESHOLD_DAYS + 1;
                    return days > DATA_UPDATE_THRESHOLD_DAYS;
                });
            }

            if (dataToExport.length > 0) {
                exportClientsToExcel(dataToExport);
                notifySuccess(`Exportación de ${dataToExport.length} empresarias completada`);
            } else {
                notifyError(null, "No hay datos para exportar con los filtros actuales");
            }
        } catch (error) {
            notifyError(error, "Error al generar el archivo Excel");
        } finally {
            setIsExporting(false);
        }
    };

    const handleOpenCreate = () => {
        if (!hasPermission('clients.create')) {
            notifyError({ message: 'No tienes permiso para crear empresarias' });
            return;
        }
        setTriggerCreate(true);
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Empresarias" 
                description="Gestiona tu red de empresarias y clientes"
                icon={Users}
                actions={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {hasPermission('clients.export_excel') && (
                            <Button 
                                variant="outline" 
                                onClick={handleExportAll} 
                                disabled={isExporting}
                                className="w-full sm:w-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Exportar Excel
                            </Button>
                        )}
                        <Button 
                            onClick={handleOpenCreate}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nueva Empresaria
                        </Button>
                    </div>
                }
            />
            <ClientList 
                triggerCreate={triggerCreate} 
                onTriggerHandled={() => setTriggerCreate(false)} 
                onFiltersChange={setActiveFilters}
            />
        </div>
    );
}
