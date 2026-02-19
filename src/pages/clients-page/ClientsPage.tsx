import { ClientList } from "@/features/clients";

export default function ClientsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Empresarias</h1>
            <ClientList />
        </div>
    );
}
