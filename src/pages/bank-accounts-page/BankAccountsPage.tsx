import { BankAccountList } from "@/features/bank-accounts"

export default function BankAccountsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Gestión Financiera</h1>
            <BankAccountList />
        </div>
    )
}
