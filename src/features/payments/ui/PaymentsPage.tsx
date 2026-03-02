import { useState, useMemo } from "react";
import { usePaymentSearch, usePaymentOperations } from "../model/hooks";
import { DollarSign, Wallet, FileText, Printer, Clock, CheckCircle2, List } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PaymentsHistoryTable } from "./PaymentsHistoryTable";
import { PaymentFormModal } from "./PaymentFormModal";
import { useToast } from "@/shared/ui/use-toast";
import { Badge } from "@/shared/ui/badge";
import { generatePaymentReceipt } from "@/features/payment-receipt/lib/generatePaymentReceipt";
import { useAuth } from "@/shared/auth";
import { PageHeader } from "@/shared/ui/PageHeader";

import { MonchitoTabs } from "@/shared/ui/MonchitoTabs";
import type { MonchitoTabConfig } from "@/shared/ui/MonchitoTabs";

export function PaymentsPage() {
    const { orders, searchOrders, loading } = usePaymentSearch();
    const { revertPayment } = usePaymentOperations();
    const { showToast } = useToast();
    const { hasPermission, user } = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("pending");

    const TABS: MonchitoTabConfig[] = [
        { id: 'pending', label: 'Pendientes', icon: Clock },
        { id: 'completed', label: 'Pagados', icon: CheckCircle2 },
        { id: 'all', label: 'Todos', icon: List },
    ];

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
        if (!hasPermission('payments.delete')) {
            showToast("No tienes permiso para eliminar abonos", "error");
            return;
        }
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
        <div className="flex flex-col h-[calc(100vh-120px)] space-y-4 overflow-hidden min-w-0">
            <PageHeader
                title="Gestión de Abonos"
                description="Registro de pagos, historial y estados de cuenta bancarios."
                icon={Wallet}
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-w-0">
                {/* Orders List & Filters */}
                <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-w-0">
                    {/* Tabs Filter */}
                    <MonchitoTabs
                        tabs={TABS}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        fullWidth
                        className="mb-4 shrink-0"
                    />

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

                <div className="lg:col-span-2 overflow-y-auto min-w-0 pr-1">
                    {selectedOrder ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 h-fit">
                            {/* Header Panel */}
                            <div className="bg-slate-50 border-b p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 leading-none">
                                        {selectedOrder.clientName}
                                    </h2>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-3 font-medium">
                                        <FileText className="h-4 w-4" />
                                        <span>Pedido: #{selectedOrder.receiptNumber}</span>
                                        <span className="opacity-30 mx-1">|</span>
                                        <span>{new Date(selectedOrder.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-sm"
                                        onClick={() => generatePaymentReceipt(selectedOrder, (selectedOrder.payments || []).map(p => ({
                                            ...p,
                                            date: p.createdAt,
                                            method: p.method || 'EFECTIVO'
                                        })), user?.username || 'Sistema')}
                                    >
                                        <Printer className="h-4 w-4" />
                                        <span>Cerrar Cuenta</span>
                                    </Button>
                                    <Button
                                        size="default"
                                        className="gap-2 bg-monchito-purple hover:bg-monchito-purple/90 text-white shadow-md transform active:scale-95 transition-all font-bold"
                                        onClick={() => {
                                            if (!hasPermission('payments.create')) {
                                                showToast("No tienes permiso para registrar abonos", "error");
                                                return;
                                            }
                                            setIsPaymentModalOpen(true);
                                        }}
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
                                    order={selectedOrder}
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
