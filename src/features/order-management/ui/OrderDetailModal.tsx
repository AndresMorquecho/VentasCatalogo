import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { OrderStatusBadge } from "./OrderStatusBadge"
import type { Order, OrderStatus } from "@/entities/order/model/types"
import { getPaidAmount, getEffectiveTotal, getPendingAmount } from "@/entities/order/model/model"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { OrderPaymentList } from "@/features/order-payments"
import { Printer, ShoppingCart, PackageOpen, Truck, Star, FileText, DollarSign, ListOrdered } from "lucide-react"
import { generateOrderReceipt } from "@/features/order-receipt"
import { useAuth } from "@/shared/auth/AuthProvider"
import { useToast } from "@/shared/ui/use-toast"
import { calculateRewardPoints } from "@/shared/lib/rewards"
import { useClient } from "@/features/clients/api/hooks"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shared/ui/accordion"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/shared/ui/tabs"

interface OrderDetailModalProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

export function OrderDetailModal({ order, open, onOpenChange }: OrderDetailModalProps) {
    const { data: response } = useBankAccountList()
    const bankAccounts = response?.data || []
    const { user } = useAuth()
    const { showToast } = useToast()

    const { data: client } = useClient(order?.clientId || "")

    if (!order) return null

    const bankAccount = order.bankAccountId
        ? bankAccounts.find((b: any) => b.id === order.bankAccountId)
        : null

    const handleGenerateReceipt = async () => {
        try {
            await generateOrderReceipt(order, {
                id: user?.id || '0',
                name: order.createdByName || user?.username || 'Administrador',
                email: '',
                role: 'OPERATOR',
                status: 'ACTIVE',
                createdAt: ''
            } as any);
            showToast("El recibo se ha generado y descargado correctamente.", "success");
        } catch (error) {
            console.error("Error generating receipt:", error);
            showToast("Hubo un problema al generar el recibo. Inténtalo de nuevo.", "error");
        }
    };

    const pointsEarned = calculateRewardPoints(order);
    const paidAmount = getPaidAmount(order);
    const effectiveTotal = getEffectiveTotal(order);
    const rawPendingAmount = effectiveTotal - paidAmount;

    // clamp it for regular view:
    const pendingAmount = Math.max(0, rawPendingAmount);
    const isPaidOut = rawPendingAmount <= 0;
    const overpaidAmount = rawPendingAmount < 0 ? Math.abs(rawPendingAmount) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader className="mb-2 pb-2">
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Detalle del Pedido</DialogTitle>
                        <OrderStatusBadge status={order.status} className="scale-110 shadow-sm" />
                    </div>
                    <DialogDescription className="sr-only">Detalle del pedido de {order.clientName}</DialogDescription>
                </DialogHeader>

                {/* Timeline */}
                <div className="mb-8 pt-2">
                    <div className="flex flex-col md:flex-row justify-between relative mt-2 items-center">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[20px] left-[15%] right-[15%] h-[2px] bg-border z-0" />

                        {/* Step 1: Created */}
                        <div className="flex flex-col items-center relative z-10 w-full md:w-1/3 mb-6 md:mb-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 mb-2">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-foreground">Pedido Creado</p>
                            <p className="text-[11px] text-muted-foreground">{formatDate(order.createdAt)}</p>
                        </div>

                        {/* Step 2: Received */}
                        <div className="flex flex-col items-center relative z-10 w-full md:w-1/3 mb-6 md:mb-0">
                            <div className={`w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center mb-2 transition-colors ${order.receptionDate ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                                <PackageOpen className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-foreground">Recepción Bodega</p>
                            <p className="text-[11px] text-muted-foreground mb-1">
                                {order.receptionDate ? formatDate(order.receptionDate) : 'Pendiente'}
                            </p>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${order.invoiceNumber ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-muted text-muted-foreground border-border'}`}>
                                Fac: {order.invoiceNumber || 'Pendiente'}
                            </span>
                        </div>

                        {/* Step 3: Delivered */}
                        <div className="flex flex-col items-center relative z-10 w-full md:w-1/3">
                            <div className={`w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center mb-2 transition-colors ${order.deliveryDate ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                <Truck className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-foreground">Entrega Cliente</p>
                            <p className="text-[11px] text-muted-foreground">{order.deliveryDate ? formatDate(order.deliveryDate) : 'Pendiente'}</p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue={order.childOrders && order.childOrders.length > 0 ? "children" : "details"} className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="children" className="font-bold tracking-tight">
                            Pedidos Asociados ({order.childOrdersCount || 0})
                        </TabsTrigger>
                        <TabsTrigger value="details" className="font-bold tracking-tight">
                            Detalles del Pedido
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="children" className="space-y-4">
                        {order.childOrders && order.childOrders.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-end mb-2">
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Desglose de Pedidos Asociados</h4>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Consolidado</p>
                                        <p className="text-xl font-black text-indigo-600 leading-none">{formatCurrency(effectiveTotal)}</p>
                                    </div>
                                </div>
                                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                                                    <th className="px-4 py-3">N° Pedido</th>
                                                    <th className="px-4 py-3">Marca</th>
                                                    <th className="px-4 py-3">Tipo</th>
                                                    <th className="px-4 py-3 text-right">Total</th>
                                                    <th className="px-4 py-3 text-right">Abono</th>
                                                    <th className="px-4 py-3 text-right">Saldo</th>
                                                    <th className="px-4 py-3 text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {/* Parent Order as the first row if it has items/relevance */}
                                                <tr className="bg-indigo-50/30 font-medium">
                                                    <td className="px-4 py-3 font-bold text-slate-900">{order.orderNumber || 'Principal'}</td>
                                                    <td className="px-4 py-3">{order.brandName}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 uppercase">{order.type}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(Number(order.total))}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(getPaidAmount(order))}</td>
                                                    <td className="px-4 py-3 text-right text-rose-600 font-bold">{formatCurrency(getPendingAmount(order))}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <OrderStatusBadge status={order.status as OrderStatus} />
                                                    </td>
                                                </tr>
                                                {/* Child Orders */}
                                                {order.childOrders.map((child) => (
                                                    <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-slate-700">{child.orderNumber || 'S/N'}</td>
                                                        <td className="px-4 py-3">{child.brandName}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${child.type === 'REPROGRAMACION' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                                {child.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(Number(child.total))}</td>
                                                        <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(getPaidAmount(child))}</td>
                                                        <td className="px-4 py-3 text-right text-rose-600 font-bold">{formatCurrency(getPendingAmount(child))}</td>
                                                        <td className="px-4 py-3 text-center text-[10px]">
                                                            <OrderStatusBadge status={child.status as OrderStatus} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <PackageOpen className="w-12 h-12 text-slate-300 mb-3" />
                                <p className="text-slate-500 font-medium">Este pedido no tiene pedidos hijos asociados.</p>
                                <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Registro Individual</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                        <Accordion type="multiple" defaultValue={["info", "finances"]} className="w-full">
                            {/* Sección 1: Información General */}
                            <AccordionItem value="info" className="border-b-0 mb-4 bg-muted/20 border rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <h4 className="font-semibold text-sm text-foreground">Información General</h4>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 pt-1">
                                        {/* Info Client & Order */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente y Pedido</h5>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-base text-foreground flex items-center gap-2">
                                                        {order.clientName}
                                                    </p>
                                                    {client?.identificationNumber && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            C.I. {client.identificationNumber}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-sm text-foreground">{order.receiptNumber}</p>
                                                    <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-secondary-foreground border">
                                                        {order.salesChannel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Product Detail & Rewards */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto y Recompensa</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Producto:</span>
                                                    <span className="font-medium text-right max-w-[150px] truncate" title={order.items?.[0]?.productName || order.brandName}>{order.items?.[0]?.productName || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Marca / Unidades:</span>
                                                    <span><span className="font-medium">{order.brandName}</span> ({order.items?.[0]?.quantity || 0} un.)</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t mt-1">
                                                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                        <Star className="w-3.5 h-3.5" /> Puntos Fidelity:
                                                    </span>
                                                    <span className="font-bold text-foreground">
                                                        +{pointsEarned} <span className="text-xs font-normal text-muted-foreground">{isPaidOut ? '(Ganados)' : '(Estimados)'}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Sección 2: Finanzas */}
                            <AccordionItem value="finances" className="border-b-0 mb-4 bg-muted/20 border rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                        <h4 className="font-semibold text-sm text-foreground">Resumen Financiero</h4>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 pt-1">
                                        {/* Financial Resumé */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance Total</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center pb-2 border-b">
                                                    <span className="flex items-center gap-2">
                                                        Valor Total
                                                        <span className="text-[9px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded uppercase font-semibold border">
                                                            {order.realInvoiceTotal ? 'Fact. Real' : 'Estimado'}
                                                        </span>
                                                    </span>
                                                    <span className="font-bold text-lg">{formatCurrency(effectiveTotal)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-muted-foreground pt-1">
                                                    <span>Pagado</span>
                                                    <span className="font-medium text-foreground">{formatCurrency(paidAmount)}</span>
                                                </div>
                                                {pendingAmount > 0 && (
                                                    <div className="flex justify-between items-center pt-1 text-muted-foreground">
                                                        <span className="font-medium">Saldo Pendiente</span>
                                                        <span className="font-bold text-foreground">{formatCurrency(pendingAmount)}</span>
                                                    </div>
                                                )}
                                                {overpaidAmount > 0 && (
                                                    <div className="flex justify-between items-center pt-1 text-muted-foreground">
                                                        <span className="font-bold text-emerald-600">Saldo a Favor del Cliente</span>
                                                        <span className="font-bold text-emerald-600">+ {formatCurrency(overpaidAmount)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Initial Payment Method */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pago Inicial</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Método:</span>
                                                    <span className="font-medium">{order.paymentMethod}</span>
                                                </div>
                                                {order.paymentMethod === 'TRANSFERENCIA' && bankAccount && (
                                                    <div className="pt-2 border-t text-xs space-y-1 mt-2">
                                                        <p className="flex justify-between">
                                                            <span className="text-muted-foreground">Banco:</span>
                                                            <span className="font-medium text-right">{bankAccount.bankName}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Sección 3: Abonos */}
                            <AccordionItem value="payments" className="border-b-0 bg-muted/20 border rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2">
                                        <ListOrdered className="w-4 h-4 text-muted-foreground" />
                                        <h4 className="font-semibold text-sm text-foreground">Historial de Abonos</h4>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-1">
                                        <OrderPaymentList order={order} readOnly />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </TabsContent>
                </Tabs>

                <div className="border-t pt-4 mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                    <Button variant="default" onClick={handleGenerateReceipt}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir / Descargar Recibo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
