import { useState, useMemo, useEffect } from "react";
import { usePaymentSearch, usePaymentOperations } from "../model/hooks";
import { Input } from "@/shared/ui/input";
import { Search, DollarSign, Wallet, FileText, Printer, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PaymentsHistoryTable } from "./PaymentsHistoryTable";
import { PaymentModal, type PaymentModalData } from "@/shared/ui/PaymentModal";
import { useToast } from "@/shared/ui/use-toast";
import { Badge } from "@/shared/ui/badge";
import { useAuth } from "@/shared/auth";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { usePDFPreview } from "@/shared/hooks/usePDFPreview";
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal";
import { preparePaymentReceiptForPreview } from "@/features/payment-receipt/lib/preparePaymentReceiptForPreview";
import { orderApi } from "@/entities/order/model/api";
import { useDebounce } from "@/shared/lib/hooks";
import { Pagination } from "@/shared/ui/pagination";

export function PaymentsPage() {
    const { hasPermission, user } = useAuth();
    const { showToast } = useToast();
    const { revertPayment, registerMultiplePayments } = usePaymentOperations();

    // Pagination & Filters State
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [activeTab, setActiveTab] = useState("pending");

    // Fetch data using the hook
    const { orders, pagination, loading, refetch } = usePaymentSearch({
        page,
        limit,
        search: debouncedSearch,
        status: activeTab === "all" ? undefined : (activeTab === "pending" ? "POR_PAGAR" : "PAGADO")
        // Note: Backend might need to interpret "POR_PAGAR" or we can pass status directly if supported
    });

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

    // PDF Preview state
    const [pdfTitle, setPdfTitle] = useState("");
    const [pdfFileName, setPdfFileName] = useState("");
    const pdfPreview = usePDFPreview({
        fileName: pdfFileName,
        onDownloadComplete: () => showToast("Archivo descargado", "success"),
        onError: () => showToast("Error al procesar PDF", "error")
    });

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, activeTab]);

    const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [selectedOrderId, orders]);

    const handleSelectOrder = (id: string) => setSelectedOrderId(id === selectedOrderId ? null : id);

    const handlePreviewAccountStatement = async (order: any) => {
        try {
            const payments = (order.payments || []).map((p: any) => ({
                ...p,
                date: p.createdAt,
                method: p.method || 'EFECTIVO'
            }));

            const { document, fileName, title } = await preparePaymentReceiptForPreview(order, payments, user?.username || 'Sistema');
            
            setPdfTitle(title);
            setPdfFileName(fileName);
            pdfPreview.openPreview(document);
        } catch (error) {
            console.error("Error generating preview:", error);
            showToast("Error al generar vista previa del estado de cuenta", "error");
        }
    };

    const handlePaymentSuccess = async (orderId?: string) => {
        showToast("Abono registrado exitosamente. Caja actualizada.", "success");
        setIsPaymentModalOpen(false);

        if (orderId) {
            try {
                const updatedOrder = await orderApi.getById(orderId);
                await handlePreviewAccountStatement(updatedOrder);
                refetch(); // Reload list to update balances
            } catch (error) {
                console.error("Error fetching updated order for PDF:", error);
            }
        }
    };

    const handlePaymentSubmit = async (data: PaymentModalData) => {
        if (!selectedOrder) return;

        try {
            const payload = {
                orderId: selectedOrder.id,
                payments: data.payments.map(payment => ({
                    amount: payment.amount,
                    method: payment.method,
                    transactionReference: payment.transactionReference,
                    bankAccountId: payment.bankAccountId,
                    notes: payment.notes
                }))
            };

            await registerMultiplePayments.mutateAsync(payload);
            await handlePaymentSuccess(selectedOrder.id);
        } catch (error) {
            console.error("Error processing payments:", error);
            showToast("Error al procesar los pagos", "error");
        }
    };

    const handleDeletePayment = (paymentId: string) => {
        if (!hasPermission('payments.delete')) {
            showToast("No tienes permiso para eliminar abonos", "error");
            return;
        }
        setPaymentToDelete(paymentId);
        setDeleteConfirmOpen(true);
    };

    const confirmDeletePayment = async () => {
        if (!paymentToDelete || !selectedOrderId) return;
        try {
            await revertPayment.mutateAsync({ orderId: selectedOrderId, paymentId: paymentToDelete });
            showToast("Abono eliminado y saldo revertido.", "info");
            refetch(); // Refresh after deletion
        } catch (e) {
            showToast("Error al eliminar abono", "error");
        } finally {
            setPaymentToDelete(null);
            setDeleteConfirmOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Gestión de Abonos" 
                description="Registro de pagos, historial y estados de cuenta"
                icon={Wallet}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders List & Filters */}
                <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-[calc(100vh-180px)] flex flex-col transition-all">
                    {/* Search Bar */}
                    <div className="relative mb-4 group">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-monchito-purple transition-colors" />
                        <Input
                            placeholder="Buscar pedido por recibo, cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-11 bg-slate-50/50 border-slate-200 focus:ring-monchito-purple/20 rounded-xl"
                        />
                    </div>

                    {/* Tabs Filter */}
                    <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 rounded-xl p-1">
                            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Pendientes</TabsTrigger>
                            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Pagados</TabsTrigger>
                            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Order List */}
                    <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                                <div className="h-8 w-8 border-4 border-slate-100 border-t-monchito-purple rounded-full animate-spin" />
                                <span className="text-sm font-bold">Buscando pedidos...</span>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30 text-slate-400">
                                {searchTerm ? (
                                    <>
                                        <Filter className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-bold">No hay coincidencias</p>
                                        <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                                        <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2 text-monchito-purple text-xs font-bold">Limpiar búsqueda</Button>
                                    </>
                                ) : (
                                    <p className="text-sm font-medium">No se encontraron pedidos {activeTab === 'pending' ? 'pendientes' : activeTab === 'completed' ? 'pagados' : ''}.</p>
                                )}
                            </div>
                        ) : (
                            orders.map(order => {
                                const paid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
                                const pending = Math.max(0, (order.realInvoiceTotal || order.total) - paid);
                                const isPaid = pending <= 0.01;

                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => handleSelectOrder(order.id)}
                                        className={`
                                        cursor-pointer p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
                                        ${selectedOrderId === order.id 
                                            ? 'bg-monchito-purple/5 border-monchito-purple ring-1 ring-monchito-purple/20' 
                                            : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md'}
                                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-black tracking-tight block text-lg ${selectedOrderId === order.id ? 'text-monchito-purple' : 'text-slate-700'}`}>
                                                        #{order.receiptNumber}
                                                    </span>
                                                    {order.orderNumber && (
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200 text-slate-400 font-mono">
                                                            {order.orderNumber}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] font-black text-monchito-purple/70 uppercase tracking-widest leading-none">
                                                        {order.brandName}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 mt-1 block uppercase truncate max-w-[180px]">
                                                    {order.clientName}
                                                </span>
                                            </div>
                                            <Badge variant={isPaid ? "default" : "destructive"} className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg ${
                                                isPaid ? "bg-emerald-100 text-emerald-700 border-none" : "bg-red-50 text-red-600 border-none"
                                            }`}>
                                                {isPaid ? "AL DÍA" : "DEUDA"}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-100/50">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                Saldo <span className="text-slate-600 font-black">${pending.toFixed(2)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[10px] text-slate-400 uppercase font-black leading-none mb-0.5">Pendiente</span>
                                                <span className={`text-xl font-mono font-black tracking-tighter leading-none ${pending > 0.01 ? "text-red-500" : "text-emerald-500"}`}>
                                                    ${pending.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {pagination && pagination.pages > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                             <Pagination
                                currentPage={page}
                                totalPages={pagination.pages}
                                onPageChange={setPage}
                                totalItems={pagination.total}
                                itemsPerPage={limit}
                            />
                        </div>
                    )}
                </div>

                {/* Selected Order Details & History */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedOrder ? (
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden sticky top-6 animate-in fade-in zoom-in-95 duration-300">
                            {/* Header Panel */}
                            <div className="bg-slate-50/50 border-b p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-monchito-purple/10 flex items-center justify-center text-monchito-purple">
                                        <Wallet className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                            {selectedOrder.clientName}
                                        </h2>
                                        <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase mt-1">
                                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                Recibo #{selectedOrder.receiptNumber}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                {new Date(selectedOrder.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full xl:w-auto">
                                    <Button
                                        variant="outline"
                                        className="gap-2 flex-1 xl:flex-initial rounded-xl border-slate-200 hover:bg-white hover:border-monchito-purple/30 font-bold"
                                        onClick={() => handlePreviewAccountStatement(selectedOrder)}
                                    >
                                        <Printer className="h-4 w-4" />
                                        <span>Estado Cuenta</span>
                                    </Button>
                                    <Button
                                        className="gap-2 flex-1 xl:flex-initial rounded-xl bg-monchito-purple hover:bg-monchito-purple/90 font-bold shadow-lg shadow-monchito-purple/20"
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50/30">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transform transition hover:-translate-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Factura</p>
                                    <div className="text-3xl font-mono font-black text-slate-700 leading-none">
                                        ${(selectedOrder.realInvoiceTotal || selectedOrder.total).toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transform transition hover:-translate-y-1">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Abonado Real</p>
                                    <div className="text-3xl font-mono font-black text-emerald-600 leading-none tracking-tighter">
                                        ${((selectedOrder.payments || []).reduce((acc, p) => acc + p.amount, 0)).toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border-2 border-red-100 shadow-sm transform transition hover:-translate-y-1 bg-red-50/10 ring-4 ring-red-50/30">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Deuda Pendiente</p>
                                    <div className="text-3xl font-mono font-black text-red-600 leading-none tracking-tighter">
                                        ${Math.max(0, (selectedOrder.realInvoiceTotal || selectedOrder.total) - ((selectedOrder.payments || []).reduce((acc, p) => acc + p.amount, 0))).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-3">
                                        Historial de Movimientos
                                        <span className="bg-monchito-purple/10 text-monchito-purple text-xs px-2.5 py-0.5 rounded-full font-black">
                                            {(selectedOrder.payments || []).length}
                                        </span>
                                    </h3>
                                </div>
                                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                    <PaymentsHistoryTable
                                        payments={selectedOrder.payments.map((p: any) => ({
                                        id: p.id,
                                        amount: p.amount,
                                        date: p.createdAt,
                                        method: p.method,
                                        reference: p.reference,
                                        receiptNumber: p.receiptNumber
                                    }))}
                                        onDelete={handleDeletePayment}
                                    />
                                </div>
                            </div>

                            {/* Modals */}
                            {isPaymentModalOpen && selectedOrder && (
                                <PaymentModal
                                    open={isPaymentModalOpen}
                                    onOpenChange={setIsPaymentModalOpen}
                                    onSubmit={handlePaymentSubmit}
                                    paymentContext={{
                                        type: "ABONO",
                                        clientId: selectedOrder.clientId,
                                        clientName: selectedOrder.clientName,
                                        referenceNumber: selectedOrder.receiptNumber,
                                        description: "Abono a pedido"
                                    }}
                                    expectedAmount={Math.max(0, (selectedOrder.realInvoiceTotal || selectedOrder.total) - ((selectedOrder.payments || []).reduce((acc, p) => acc + p.amount, 0)))}
                                    allowMultiplePayments={true}
                                />
                            )}

                            {pdfPreview.pdfDocument && (
                                <PDFPreviewModal
                                    open={pdfPreview.isOpen}
                                    onOpenChange={pdfPreview.closePreview}
                                    title={pdfTitle}
                                    pdfDocument={pdfPreview.pdfDocument}
                                    fileName={pdfFileName}
                                    onDownload={pdfPreview.downloadPDF}
                                    onPrint={pdfPreview.printPDF}
                                />
                            )}
                            
                            <ConfirmDialog
                                open={deleteConfirmOpen}
                                onOpenChange={setDeleteConfirmOpen}
                                onConfirm={confirmDeletePayment}
                                title="Eliminar Abono"
                                description="Esta acción es irreversible y afectará el saldo del pedido y la contabilidad de caja. ¿Desea continuar?"
                                confirmText="Sí, Eliminar"
                                variant="destructive"
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 min-h-[500px] p-12 text-center animate-pulse">
                            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                <Wallet className="h-10 w-10 opacity-30" />
                            </div>
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">Panel de Control de Abonos</h3>
                            <p className="max-w-xs mx-auto text-sm text-slate-400 font-medium">Seleccione uno de los pedidos del listado lateral para visualizar su desglose financiero, registrar nuevos abonos o imprimir estados de cuenta.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
