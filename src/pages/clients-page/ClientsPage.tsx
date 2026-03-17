import { ClientList } from "@/features/clients";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Users, Download, Loader2, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { clientApi } from "@/shared/api/clientApi";
import { exportClientsToExcel } from "@/features/clients/lib/exportUtils";
import { useNotifications } from "@/shared/lib/notifications";

export default function ClientsPage() {
    const [isExporting, setIsExporting] = useState(false);
    const [triggerCreate, setTriggerCreate] = useState(false);
    const { notifySuccess, notifyError } = useNotifications();

    const handleExportAll = async () => {
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

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Empresarias" 
                description="Gestiona tu red de empresarias y clientes"
                icon={Users}
                actions={
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleExportAll} 
                            disabled={isExporting}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Exportar Excel
                        </Button>
                        <Button onClick={() => setTriggerCreate(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Empresaria
                        </Button>
                    </div>
                }
            />
            <ClientList triggerCreate={triggerCreate} onTriggerHandled={() => setTriggerCreate(false)} />
        </div>
    );
}
