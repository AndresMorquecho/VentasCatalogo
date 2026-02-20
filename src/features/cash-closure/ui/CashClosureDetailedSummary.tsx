import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { CashClosureDetailedReport } from "@/entities/cash-closure/model/detailed-types";
import { DollarSign, TrendingUp, Users, CreditCard, Building2, List } from "lucide-react";

interface Props {
    report: CashClosureDetailedReport;
}

export function CashClosureDetailedSummary({ report }: Props) {
    const {
        totalIncome,
        totalExpense,
        netTotal,
        movementCount,
        fromDate,
        toDate,
        incomeBySource,
        incomeByMethod,
        balanceByBank,
        movementsByUser,
        movements
    } = report;

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatPercent = (amount: number, total: number) => 
        total > 0 ? `${((amount / total) * 100).toFixed(1)}%` : '0%';

    return (
        <div className="space-y-6">
            {/* Resumen Ejecutivo */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Resumen del Período ({fromDate} - {toDate})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                            <span className="text-sm font-medium text-green-700">Total Ingresos</span>
                            <div className="text-2xl font-bold text-green-900">{formatCurrency(totalIncome)}</div>
                        </div>
                        <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                            <span className="text-sm font-medium text-red-700">Total Egresos</span>
                            <div className="text-2xl font-bold text-red-900">{formatCurrency(totalExpense)}</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${netTotal >= 0 ? 'bg-blue-50/50 border-blue-100' : 'bg-orange-50/50 border-orange-100'}`}>
                            <span className="text-sm font-medium text-gray-700">Balance Neto</span>
                            <div className={`text-2xl font-bold ${netTotal >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                                {formatCurrency(netTotal)}
                            </div>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">Movimientos</span>
                            <div className="text-2xl font-bold text-slate-900">{movementCount}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs con Desglose Detallado */}
            <Tabs defaultValue="source" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="source" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Por Origen
                    </TabsTrigger>
                    <TabsTrigger value="method" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Por Método
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Por Cuenta
                    </TabsTrigger>
                    <TabsTrigger value="user" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Por Usuario
                    </TabsTrigger>
                    <TabsTrigger value="detail" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Detalle
                    </TabsTrigger>
                </TabsList>

                {/* Por Origen */}
                <TabsContent value="source">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Desglose por Origen de Ingresos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="font-medium">Abonos Iniciales (Pedidos)</span>
                                    <div className="text-right">
                                        <div className="font-bold text-blue-900">{formatCurrency(incomeBySource.orderPayments)}</div>
                                        <div className="text-xs text-blue-600">{formatPercent(incomeBySource.orderPayments, totalIncome)}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                                    <span className="font-medium">Abonos Posteriores</span>
                                    <div className="text-right">
                                        <div className="font-bold text-emerald-900">{formatCurrency(incomeBySource.additionalPayments)}</div>
                                        <div className="text-xs text-emerald-600">{formatPercent(incomeBySource.additionalPayments, totalIncome)}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                                    <span className="font-medium">Ajustes</span>
                                    <div className="text-right">
                                        <div className="font-bold text-amber-900">{formatCurrency(incomeBySource.adjustments)}</div>
                                        <div className="text-xs text-amber-600">{formatPercent(incomeBySource.adjustments, totalIncome)}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="font-medium">Movimientos Manuales</span>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900">{formatCurrency(incomeBySource.manual)}</div>
                                        <div className="text-xs text-slate-600">{formatPercent(incomeBySource.manual, totalIncome)}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Por Método de Pago */}
                <TabsContent value="method">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Desglose por Método de Pago</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span className="font-medium">💵 Efectivo</span>
                                    <div className="text-right">
                                        <div className="font-bold text-green-900">{formatCurrency(incomeByMethod.EFECTIVO)}</div>
                                        <div className="text-xs text-green-600">{formatPercent(incomeByMethod.EFECTIVO, totalIncome)}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="font-medium">🏦 Transferencia</span>
                                    <div className="text-right">
                                        <div className="font-bold text-blue-900">{formatCurrency(incomeByMethod.TRANSFERENCIA)}</div>
                                        <div className="text-xs text-blue-600">{formatPercent(incomeByMethod.TRANSFERENCIA, totalIncome)}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                    <span className="font-medium">💳 Depósito</span>
                                    <div className="text-right">
                                        <div className="font-bold text-purple-900">{formatCurrency(incomeByMethod.DEPOSITO)}</div>
                                        <div className="text-xs text-purple-600">{formatPercent(incomeByMethod.DEPOSITO, totalIncome)}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                    <span className="font-medium">📝 Cheque</span>
                                    <div className="text-right">
                                        <div className="font-bold text-orange-900">{formatCurrency(incomeByMethod.CHEQUE)}</div>
                                        <div className="text-xs text-orange-600">{formatPercent(incomeByMethod.CHEQUE, totalIncome)}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Por Cuenta Bancaria */}
                <TabsContent value="bank">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Desglose por Cuenta Bancaria</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cuenta</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {balanceByBank.map((item) => (
                                        <TableRow key={item.bankAccountId}>
                                            <TableCell className="font-medium">{item.bankAccountName}</TableCell>
                                            <TableCell className={`text-right font-mono font-bold ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(item.balance)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Por Usuario */}
                <TabsContent value="user">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Desglose por Usuario</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead className="text-right">Ingresos</TableHead>
                                        <TableHead className="text-right">Egresos</TableHead>
                                        <TableHead className="text-right">Movimientos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movementsByUser.map((user) => (
                                        <TableRow key={user.userId}>
                                            <TableCell className="font-medium">{user.userName}</TableCell>
                                            <TableCell className="text-right font-mono text-green-600">
                                                {formatCurrency(user.totalIncome)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-red-600">
                                                {formatCurrency(user.totalExpense)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {user.movementCount}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Detalle Completo */}
                <TabsContent value="detail">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Detalle Completo de Movimientos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha/Hora</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Origen</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead>Cuenta</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                            <TableHead>Usuario</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements.map((mov) => (
                                            <TableRow key={mov.id}>
                                                <TableCell className="text-xs">
                                                    {new Date(mov.date).toLocaleString('es-EC', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-xs px-2 py-1 rounded ${mov.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {mov.type === 'INCOME' ? 'ING' : 'EGR'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs">{mov.source}</TableCell>
                                                <TableCell className="text-xs">{mov.clientName || '-'}</TableCell>
                                                <TableCell className="text-xs">{mov.paymentMethod || '-'}</TableCell>
                                                <TableCell className="text-xs">{mov.bankAccountName}</TableCell>
                                                <TableCell className={`text-right font-mono font-bold ${mov.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(mov.amount)}
                                                </TableCell>
                                                <TableCell className="text-xs">{mov.createdByName || mov.createdBy}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
