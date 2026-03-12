import { BankAccountList } from "@/features/bank-accounts"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Wallet } from "lucide-react"

export default function BankAccountsPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Gestión Financiera" 
                description="Administra cuentas bancarias y efectivo"
                icon={Wallet}
            />
            <BankAccountList />
        </div>
    )
}
