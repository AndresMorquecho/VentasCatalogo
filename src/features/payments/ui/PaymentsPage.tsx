import { useState, useMemo } from "react";
import { usePaymentSearch, usePaymentOperations } from "../model/hooks";
import { Input } from "@/shared/ui/input";
import { Search, DollarSign, Wallet, FileText, Printer } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PaymentsHistoryTable } from "./PaymentsHistoryTable";
import { PaymentFormModal } from "./PaymentFormModal";
import { useToast } from "@/shared/ui/use-toast";
import { Badge } from "@/shared/ui/badge";
import { generatePaymentReceipt } from "@/features/payment-receipt/lib/generatePaymentReceipt";

import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export function PaymentsPage() {
    const { orders, searchOrders, loading } = usePaymentSearch();
    const { revertPayment } = usePaymentOperations();
    const { showToast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("pending");

    // Filter Logic
    const filteredOrders = useMemo(() => {
        let matching = searchOrders(searchTerm);

        if (activeTab === "pending") {
            matching = matching.filter(o => {
                const paid = (o.payments || []).reduce((acc, p) => acc + p.amount, 0);
                const total = o.realInvoiceTotal || o.total;
                return (total - paid) > 0.01;
            });
        } else if (activeTab === "completed") {
            matching = matching.filter(o => {
                const paid = (o.payments || []).reduce((acc, p) => acc + p.amount, 0);
                const total = o.realInvoiceTotal || o.total;
                return (total - paid) <= 0.01;
            });
        }

        return matching;
    }, [searchTerm, orders, activeTab]);

    const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [selectedOrderId, orders]);

    const handleSelectOrder = (id: string) => setSelectedOrderId(id === selectedOrderId ? null : id);

    const handlePaymentSuccess = () => {
        showToast("Abono registrado exitosamente. Caja actualizada.", "success");
        setIsPaymentModalOpen(false);
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm("¿Está seguro de eliminar este abono? Esta acción revertirá el saldo y la caja.")) return;
        try {
            if (selectedOrderId) {
                await revertPayment.mutateAsync({ orderId: selectedOrderId, paymentId });
                showToast("Abono eliminado y saldo revertido.", "info");
            }
        } catch (e) {
            showToast("Error al eliminar abono", "error");
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-emerald-600" />
                        Gestión de Abonos
                    </h1>
                    <p className="text-slate-500 text-sm">Registro de pagos, historial y estados de cuenta.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders List & Filters */}
                <div className="lg:col-span-1 border-r pr-4 bg-white p-4 rounded-lg shadow-sm h-[calc(100vh-100px)] flex flex-col">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar pedido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10"
                        />
                    </div>

                    {/* Tabs Filter */}
                    <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="pending">Pendientes</TabsTrigger>
                            <TabsTrigger value="completed">Pagados</TabsTrigger>
                            <TabsTrigger value="all">Todos</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* List */}
                    <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                        {loading ? (
                            <div className="text-center py-8 text-slate-400">Cargando pedidos...</div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-400">
                                No se encontraron pedidos {activeTab === 'pending' ? 'pendientes' : activeTab === 'completed' ? 'pagados' : ''}.
                            </div>
                        ) : (
                            filteredOrders.map(order => {
                                const paid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
                                const pending = (order.realInvoiceTotal || order.total) - paid;
                                const isPaid = pending <= 0.01;

                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => handleSelectOrder(order.id)}
                                        className={`
                                        cursor-pointer p-4 rounded-lg border transition-all hover:shadow-md relative overflow-hidden
                                        ${selectedOrderId === order.id ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200'}
                                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-bold text-slate-700 block text-lg">#{order.receiptNumber}</span>
                                                <span className="text-sm text-slate-500">{order.clientName}</span>
                                            </div>
                                            <Badge variant={isPaid ? "default" : "destructive"} className={isPaid ? "bg-emerald-100 text-emerald-700" : ""}>
                                                {isPaid ? "PAGADO" : "PENDIENTE"}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100">
                                            <div className="text-xs text-slate-400">
                                                Total: <span className="font-semibold text-slate-600">${(order.realInvoiceTotal || order.total).toFixed(2)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[10px] text-slate-400 uppercase font-bold">Saldo Pendiente</span>
                                                <span className={`text-xl font-bold ${pending > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                                    ${pending.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Selected Order Details & History */}
                <div className="lg:col-span-2">
                    {selectedOrder ? (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden sticky top-24 animate-in slide-in-from-right-4 duration-300">
                            {/* Header Panel */}
                            <div className="bg-slate-50 border-b p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {selectedOrder.clientName}
                                    </h2>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <FileText className="h-4 w-4" />
                                        <span>Pedido: #{selectedOrder.receiptNumber}</span>
                                        <span className="mx-2">•</span>
                                        <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => generatePaymentReceipt(selectedOrder, (selectedOrder.payments || []).map(p => ({
                                            ...p,
                                            date: p.createdAt,
                                            method: p.method || 'EFECTIVO' // Fallback
                                        })))}
                                    >
                                        <Printer className="h-4 w-4" />
                                        <span>Estado Cuenta</span>
                                    </Button>
                                    <Button
                                        size="default"
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md transform hover:scale-105 transition-all"
                                        onClick={() => setIsPaymentModalOpen(true)}
                                    >
                                        <DollarSign className="h-4 w-4" />
                                        Registrar Abono
                                    </Button>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50/50 border-b">
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Facturado</span>
                                    <div className="text-2xl font-bold text-slate-700">
                                        ${(selectedOrder.realInvoiceTotal || selectedOrder.total).toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <span className="text-xs font-bold text-emerald-600 uppercase">Abonado</span>
                                    <div className="text-2xl font-bold text-emerald-600">
                                        ${((selectedOrder.payments || []).reduce((acc, p) => acc + p.amount, 0)).toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border shadow-sm ring-1 ring-red-100">
                                    <span className="text-xs font-bold text-red-500 uppercase">Por Pagar</span>
                                    <div className="text-2xl font-bold text-red-600">
                                        ${((selectedOrder.realInvoiceTotal || selectedOrder.total) - ((selectedOrder.payments || []).reduce((acc, p) => acc + p.amount, 0))).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="p-6">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    Historial de Pagos
                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                        {(selectedOrder.payments || []).length}
                                    </span>
                                </h3>
                                <PaymentsHistoryTable
                                    payments={(selectedOrder.payments || []).map(p => ({
                                        ...p,
                                        date: p.createdAt,
                                        method: p.method || 'DESCONOCIDO'
                                    }))}
                                    onDelete={handleDeletePayment}
                                />
                            </div>

                            {/* Modals */}
                            {isPaymentModalOpen && (
                                <PaymentFormModal
                                    order={{
                                        id: selectedOrder.id,
                                        clientId: selectedOrder.clientId,
                                        finalTotal: selectedOrder.realInvoiceTotal || selectedOrder.total,
                                        receiptNumber: selectedOrder.receiptNumber,
                                        totalPaid: (selectedOrder.payments || []).reduce((acc, p) => acc + p.amount, 0)
                                    }}
                                    isOpen={isPaymentModalOpen}
                                    onClose={() => setIsPaymentModalOpen(false)}
                                    onSuccess={handlePaymentSuccess}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed rounded-xl bg-slate-50 min-h-[400px]">
                            <Wallet className="h-16 w-16 mb-4 opacity-20" />
                            <p>Seleccione un pedido para ver detalles y registrar abonos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
