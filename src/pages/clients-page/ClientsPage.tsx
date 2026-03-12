import { ClientList } from "@/features/clients";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Users } from "lucide-react";

export default function ClientsPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Empresarias" 
                description="Gestiona tu red de empresarias y clientes"
                icon={Users}
            />
            <ClientList />
        </div>
    );
}
