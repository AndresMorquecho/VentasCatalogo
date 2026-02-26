import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
// import { Separator } from "@/shared/ui/separator"
import type { CreateCashClosurePayload } from "@/entities/cash-closure/model/types"

interface CashClosureSummaryProps {
    data: CreateCashClosurePayload
}

export function CashClosureSummary({ data }: CashClosureSummaryProps) {
    const {
        totalIncome = 0,
        totalExpense = 0,
        netTotal = 0,
        balanceByBank = [],
        movementCount = 0,
        fromDate = "",
        toDate
    } = data

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Resumen del Periodo ({fromDate} - {toDate})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                            <span className="text-sm font-medium text-green-700">Total Ingresos</span>
                            <div className="text-2xl font-bold text-green-900">${totalIncome.toFixed(2)}</div>
                        </div>
                        <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                            <span className="text-sm font-medium text-red-700">Total Egresos</span>
                            <div className="text-2xl font-bold text-red-900">${totalExpense.toFixed(2)}</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${netTotal >= 0 ? 'bg-blue-50/50 border-blue-100' : 'bg-orange-50/50 border-orange-100'}`}>
                            <span className="text-sm font-medium text-gray-700">Balance Neto</span>
                            <div className={`text-2xl font-bold ${netTotal >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                                ${netTotal.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground pt-2">
                        Movimientos procesados: <span className="font-medium text-foreground">{movementCount}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Detalle por Cuenta Bancaria</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {balanceByBank.map((item: any) => (
                            <div key={item.bankAccountId} className="flex justify-between items-center py-2 border-b last:border-0 hover:bg-slate-50/50 px-2 rounded transition-colors">
                                <span className="font-medium">{item.bankAccountName}</span>
                                <span className={`font-mono ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${item.balance.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
