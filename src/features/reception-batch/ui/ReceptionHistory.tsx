import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useToast } from "@/shared/ui/use-toast"
import { generateOrderLabels } from "@/features/order-labels/lib/generateOrderLabels"
import { Search, Printer, Edit2, Save, X, AlertTriangle } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import type { Order } from "@/entities/order/model/types"
import type { Client } from "@/entities/client/model/types"
import { orderApi } from "@/entities/order/model/api"
import { getPendingAmount } from "@/entities/order/model/model"

interface Props {
    orders: Order[]
    clients: Client[]
}

export function ReceptionHistory({ orders, clients }: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState("")
    const [dateFilter, setDateFilter] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editAmount, setEditAmount] = useState<string>("")
    const [isSaving, setIsSaving] = useState(false)

    const { showToast } = useToast()
    const queryClient = useQueryClient()

    // 1. Filter Logic
    const receivedOrders = useMemo(() => {
        return orders
            .filter(o => o.status === 'RECIBIDO_EN_BODEGA' || o.status === 'ENTREGADO')
            .sort((a, b) => new Date(b.receptionDate || b.createdAt).getTime() - new Date(a.receptionDate || a.createdAt).getTime())
    }, [orders])

    const clientMap = useMemo(() => {
        const map = new Map<string, Client>();
        clients.forEach(c => map.set(c.id, c));
        return map;
    }, [clients]);

    const filteredOrders = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase().trim();
        const targetDate = dateFilter ? new Date(dateFilter).toISOString().split('T')[0] : null;

        return receivedOrders.filter(o => {
            let matchesSearch = true;
            if (lowerSearch) {
                const client = clientMap.get(o.clientId);
                const identification = client?.identificationNumber?.toLowerCase() || "";
                matchesSearch = (
                    o.clientName.toLowerCase().includes(lowerSearch) ||
                    o.receiptNumber.toLowerCase().includes(lowerSearch) ||
                    identification.includes(lowerSearch) ||
                    (o.brandName ? o.brandName.toLowerCase().includes(lowerSearch) : false)
                );
            }

            let matchesDate = true;
            if (targetDate) {
                const rDateStr = o.receptionDate || o.createdAt;
                const rDate = new Date(rDateStr).toISOString().split('T')[0];
                matchesDate = rDate === targetDate;
            }

            return matchesSearch && matchesDate;
        });
    }, [receivedOrders, searchTerm, dateFilter, clientMap]);

    // 2. Selection Logic
    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        const allIds = filteredOrders.map(o => o.id);
        if (selected.size === allIds.length && allIds.length > 0) setSelected(new Set());
        else setSelected(new Set(allIds));
    }

    // 3. Print Logic
    const handlePrint = async () => {
        const toPrint = orders.filter(o => selected.has(o.id));
        if (toPrint.length === 0) return;

        try {
            await generateOrderLabels({
                orders: toPrint,
                clients: clients,
                user: { name: 'Operador' }
            });
            showToast("Etiquetas generadas exitosamente", "success");
            setSelected(new Set());
        } catch (e) {
            console.error(e);
            showToast("Error al generar etiquetas", "error");
        }
    }

    // 4. Edit Logic
    const startEdit = (order: Order) => {
        const payments = order.payments || [];
        if (payments.length === 0) {
            showToast("Este pedido no tiene pagos registrados.", "error");
            return;
        }
        const lastPayment = payments[payments.length - 1];
        setEditingId(order.id);
        setEditAmount(lastPayment.amount.toString());
    }

    const saveEdit = async () => {
        if (!editingId) return;
        const order = orders.find(o => o.id === editingId);
        if (!order) return;

        const newAmount = parseFloat(editAmount);
        if (isNaN(newAmount) || newAmount < 0) {
            showToast("Monto inválido", "error");
            return;
        }

        setIsSaving(true);
        try {
            const payments = order.payments || [];
            if (payments.length === 0) return;

            const lastPayment = payments[payments.length - 1];

            const otherPaymentsSum = payments.slice(0, -1).reduce((sum, p) => sum + p.amount, 0);
            const totalToCover = order.realInvoiceTotal || order.total;
            const maxAllowed = totalToCover - otherPaymentsSum;

            if (newAmount > maxAllowed + 0.01) {
                showToast(`El nuevo monto excede el saldo. Máximo: $${maxAllowed.toFixed(2)}`, "error");
                setIsSaving(false);
                return;
            }

            const updatedPayments = [...payments];
            updatedPayments[updatedPayments.length - 1] = {
                ...lastPayment,
                amount: newAmount
            };

            const newPaidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

            await orderApi.update(order.id, {
                payments: updatedPayments,
                paidAmount: newPaidAmount
            });

            showToast("Abono actualizado.", "success");
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setEditingId(null);

        } catch (error) {
            console.error(error);
            showToast("Error al actualizar abono", "error");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-4 h-full flex flex-col pt-2">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center shadow-sm">
                <div className="flex gap-2 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar cliente, recibo, marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="relative w-40">
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    {(searchTerm || dateFilter) && (
                        <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(''); setDateFilter(''); }}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handlePrint}
                        disabled={selected.size === 0}
                        variant="outline"
                        className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir ({selected.size})
                    </Button>
                </div>
            </div>

            <div className="border rounded-md overflow-hidden flex-1 bg-white shadow-sm overflow-y-auto">
                <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <input
                                    type="checkbox"
                                    checked={filteredOrders.length > 0 && selected.size === filteredOrders.length}
                                    onChange={toggleAll}
                                    className="accent-slate-600 h-4 w-4 cursor-pointer"
                                />
                            </TableHead>
                            <TableHead>Fecha Recep.</TableHead>
                            <TableHead>Cliente / Marca</TableHead>
                            <TableHead>Recibo</TableHead>
                            <TableHead className="text-right">Total Factura</TableHead>
                            <TableHead className="text-right">Último Abono</TableHead>
                            <TableHead className="text-right">Saldo Pendiente</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                    No se encontraron recepciones con los filtros aplicados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map(order => {
                                const pending = getPendingAmount(order);
                                const isEditing = editingId === order.id;
                                const lastPay = (order.payments && order.payments.length > 0)
                                    ? order.payments[order.payments.length - 1].amount
                                    : 0;

                                return (
                                    <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selected.has(order.id)}
                                                onChange={() => toggle(order.id)}
                                                className="accent-slate-600 h-4 w-4 cursor-pointer"
                                            />
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {order.receptionDate ? new Date(order.receptionDate).toLocaleDateString('es-EC') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800">{order.clientName}</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                    {order.brandName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">#{order.receiptNumber}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            ${(order.realInvoiceTotal || order.total).toFixed(2)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="w-24 text-right h-8 px-2 text-sm ml-auto border-blue-300 ring-2 ring-blue-100"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-mono text-sm text-green-700">
                                                    ${lastPay.toFixed(2)}
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className={`text-right font-mono text-sm font-bold ${pending > 0.01 ? 'text-amber-600' : 'text-slate-400'}`}>
                                            ${pending.toFixed(2)}
                                        </TableCell>

                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex gap-1 justify-end">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={saveEdit} disabled={isSaving}>
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setEditingId(null)} disabled={isSaving}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 opacity-50 hover:opacity-100 hover:bg-blue-50 text-blue-600"
                                                    onClick={() => startEdit(order)}
                                                    title="Editar último pago"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-md text-xs flex items-center gap-2 border border-amber-100">
                <AlertTriangle className="h-4 w-4" />
                <p>
                    <strong>Cuidado:</strong> Editar el "Último Abono" modifica el historial financiero y el saldo pendiente.
                    Realice cambios solo si es estrictamente necesario (ej. corrección de errores).
                </p>
            </div>
        </div>
    )
}
