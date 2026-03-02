import { ClientList } from "@/features/clients";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Users } from "lucide-react";
import { useState } from "react";

export default function ClientsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="space-y-4">
            <PageHeader
                title="Empresarias"
                description="Listado y gestión de empresarias registradas en el sistema."
                icon={Users}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <ClientList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </div>
    );
}
