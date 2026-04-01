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
    const { notifySuccess, notifyError } = useNotifications();
    const { hasPermission } = useAuth();

    const handleExportAll = async () => {
        if (!hasPermission('clients.view')) {
            notifyError({ message: 'No tienes permiso para exportar datos' });
            return;
        }
        try {
            setIsExporting(true);
            const response = await clientApi.getAll({ limit: 2000 });
            if (response.data && response.data.length > 0) {
                exportClientsToExcel(response.data);
                notifySuccess(`Exportación de ${response.data.length} empresarias completada`);
            } else {
                notifyError(null, "No hay datos para exportar");
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
                        <Button 
                            variant="outline" 
                            onClick={handleExportAll} 
                            disabled={isExporting}
                            className="w-full sm:w-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Exportar Excel
                        </Button>
                        <Button 
                            onClick={handleOpenCreate}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nueva Empresaria
                        </Button>
                    </div>
                }
            />
            <ClientList triggerCreate={triggerCreate} onTriggerHandled={() => setTriggerCreate(false)} />
        </div>
    );
}
