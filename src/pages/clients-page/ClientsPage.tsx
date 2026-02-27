import { ClientList } from "@/features/clients";

export default function ClientsPage() {
    return (
        <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Empresarias</h1>
            <ClientList />
        </div>
    );
}
