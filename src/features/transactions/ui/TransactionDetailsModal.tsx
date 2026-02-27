import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/shared/ui/dialog"
import type { FinancialRecord } from "@/entities/financial-record/model/types"
import { Badge } from "@/shared/ui/badge"

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: FinancialRecord | null
}

export function TransactionDetailsModal({ open, onOpenChange, transaction }: Props) {
    if (!transaction) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Badge variant="outline">{transaction.type}</Badge>
                        #{transaction.referenceNumber}
                    </DialogTitle>
                    <DialogDescription>
                        Registrado el {new Date(transaction.createdAt).toLocaleString()} por {transaction.createdBy}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-sm">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-500">Monto Total</span>
                        <span className="text-2xl font-bold text-slate-900">${transaction.amount.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Fecha Operación</span>
                            <span className="font-medium">{new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Cliente ID</span>
                            <span className="font-medium font-mono">{transaction.clientId}</span>
                        </div>
                    </div>

                    {/* Logic for Client Credit details would go here if we tracked it in TX directly */}
                    {/* Currently TX is simple. We assume credit is separate entity linked by originTransactionId? */}
                    {/* Yes, ClientCredit has originTransactionId. We'd need to fetch credit to show it here. Not implemented in this modal yet. */}
                </div>
            </DialogContent>
        </Dialog>
    )
}
