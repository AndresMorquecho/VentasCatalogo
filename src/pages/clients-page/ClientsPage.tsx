import { ClientList } from "@/features/clients";

export default function ClientsPage() {
    return (
        <div className="space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Empresarias</h1>
            <ClientList />
        </div>
    );
}
